import argparse
import json
import os
import re
import subprocess
from datetime import datetime
from typing import Any


GROUP_NAME_OVERRIDES = {
    "control": "Control Group",
    "dynamic_prompt_group": "Dynamic Prompt Group",
}

LANGUAGE_LABELS = {
    "japanese": "日本語",
    "english": "英語",
}


def logging(msg: str, is_json: bool) -> None:
    if not is_json:
        print(msg)


def emit_error(message: str, is_json: bool) -> None:
    if is_json:
        print(json.dumps({"error": {"message": message}}, ensure_ascii=False))
    else:
        logging(message, is_json)


def fail(message: str, is_json: bool) -> None:
    emit_error(message, is_json)
    raise SystemExit(1)


def extract_metrics(discussion_log: list[dict[str, Any]]) -> dict[str, float | int]:
    total_response_length = 0
    total_response_time_ms = 0.0
    num_llm_calls = 0

    for entry in discussion_log:
        response = entry.get("response_received")
        if isinstance(response, str):
            total_response_length += len(response)
            match = re.search(r"Ollama API call to llama3:8b took (\d+\.\d+) ms", response)
            if match:
                total_response_time_ms += float(match.group(1))
                num_llm_calls += 1

    avg_response_time_ms = total_response_time_ms / num_llm_calls if num_llm_calls > 0 else 0.0

    return {
        "total_response_length": total_response_length,
        "avg_response_time_ms": avg_response_time_ms,
        "num_llm_calls": num_llm_calls,
    }


def load_config(config_path: str, is_json: bool) -> dict[str, Any]:
    if not os.path.exists(config_path):
        fail(f"Error: Config file not found: {config_path}. Exiting.", is_json)

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
    except json.JSONDecodeError:
        fail(f"Error: Failed to parse config file as JSON: {config_path}.", is_json)

    if not isinstance(config, dict):
        fail(f"Error: Config file must contain a JSON object: {config_path}.", is_json)

    logging(f"Loaded config from {config_path}", is_json)
    return config


def get_first_user_prompt(config: dict[str, Any], is_json: bool) -> str:
    test_prompts = config.get("test_prompts", [])
    if not isinstance(test_prompts, list) or not test_prompts:
        fail("Error: 'test_prompts' not found or empty in config. Exiting.", is_json)

    first_prompt = test_prompts[0]
    if not isinstance(first_prompt, dict):
        fail("Error: The first entry in 'test_prompts' must be an object with prompt metadata.", is_json)

    user_prompt = first_prompt.get("user_prompt")
    if not isinstance(user_prompt, str) or not user_prompt.strip():
        fail("Error: The first entry in 'test_prompts' must include a non-empty user_prompt.", is_json)

    return user_prompt


def get_report_groups(config: dict[str, Any], is_json: bool) -> list[dict[str, str]]:
    test_groups = config.get("test_groups", [])
    if not isinstance(test_groups, list) or len(test_groups) != 2:
        fail("Error: 'test_groups' must contain exactly two group definitions.", is_json)

    normalized_groups: list[dict[str, str]] = []
    for group in test_groups:
        if not isinstance(group, dict):
            fail("Error: Each entry in 'test_groups' must be an object.", is_json)

        group_id = group.get("id")
        if not isinstance(group_id, str) or not group_id.strip():
            fail("Error: Each test group must include a non-empty id.", is_json)

        prompt_language = group.get("prompt_language", "")
        if prompt_language is not None and not isinstance(prompt_language, str):
            fail(f"Error: Test group '{group_id}' has an invalid prompt_language.", is_json)

        normalized_groups.append(
            {
                "id": group_id,
                "prompt_language": prompt_language or "",
            }
        )

    return normalized_groups


def normalize_final_output(final_output: Any) -> str:
    if not isinstance(final_output, str):
        raise ValueError("Run result must include a string finalOutput.")

    try:
        parsed_output = json.loads(final_output)
    except json.JSONDecodeError:
        return final_output

    if isinstance(parsed_output, str):
        return parsed_output

    return json.dumps(parsed_output, ensure_ascii=False, indent=2)


def extract_runner_error_message(error_payload: Any) -> str:
    if isinstance(error_payload, dict):
        message = error_payload.get("message")
        if isinstance(message, str) and message.strip():
            return message
    if isinstance(error_payload, str) and error_payload.strip():
        return error_payload
    return "A/B test runner reported an error."


def get_runner_failure_message(exc: subprocess.CalledProcessError) -> str:
    stdout = exc.stdout
    if isinstance(stdout, str) and stdout.strip():
        try:
            parsed_stdout = json.loads(stdout)
        except json.JSONDecodeError:
            pass
        else:
            if isinstance(parsed_stdout, dict) and "error" in parsed_stdout:
                message = extract_runner_error_message(parsed_stdout["error"])
                return f"A/B test runner reported an error: {message}"

    return f"A/B test runner failed with exit code {exc.returncode}."


def normalize_runner_results(raw_stdout: str, group_ids: list[str]) -> dict[str, Any]:
    try:
        parsed_results = json.loads(raw_stdout)
    except json.JSONDecodeError as exc:
        raise ValueError("Failed to parse A/B test results as JSON.") from exc

    if not isinstance(parsed_results, dict):
        raise ValueError("A/B test runner returned an unexpected top-level JSON value.")

    if "error" in parsed_results:
        message = extract_runner_error_message(parsed_results["error"])
        raise ValueError(f"A/B test runner reported an error: {message}")

    if not parsed_results:
        raise ValueError("A/B test runner returned no prompt results.")

    normalized_results: dict[str, Any] = {}

    for prompt_id, prompt_results in parsed_results.items():
        if not isinstance(prompt_results, dict):
            raise ValueError(f"Prompt '{prompt_id}' must map to a JSON object.")

        normalized_prompt_results: dict[str, Any] = {}
        for group_id in group_ids:
            group_results = prompt_results.get(group_id)
            if not isinstance(group_results, dict):
                raise ValueError(f"Missing test group '{group_id}' in results for prompt '{prompt_id}'.")

            run_results = group_results.get("run_1")
            if not isinstance(run_results, dict):
                raise ValueError(f"Missing 'run_1' for test group '{group_id}' in prompt '{prompt_id}'.")

            discussion_log = run_results.get("discussionLog")
            if not isinstance(discussion_log, list) or any(not isinstance(entry, dict) for entry in discussion_log):
                raise ValueError(
                    f"Run 'run_1' for test group '{group_id}' in prompt '{prompt_id}' must include a discussionLog list."
                )

            normalized_prompt_results[group_id] = {
                "run_1": {
                    "finalOutput": normalize_final_output(run_results.get("finalOutput")),
                    "discussionLog": discussion_log,
                }
            }

        normalized_results[prompt_id] = normalized_prompt_results

    return normalized_results


def format_group_label(group: dict[str, str]) -> str:
    group_id = group["id"]
    base_label = GROUP_NAME_OVERRIDES.get(group_id, group_id.replace("_", " ").title())
    if "group" not in base_label.lower():
        base_label = f"{base_label} Group"

    prompt_language = group.get("prompt_language", "")
    if prompt_language:
        language_label = LANGUAGE_LABELS.get(prompt_language.lower(), prompt_language)
        return f"{base_label} ({language_label})"

    return base_label


def build_report_content(
    config_path: str,
    prompt_language_test_enabled: bool,
    normalized_results: dict[str, Any],
    report_groups: list[dict[str, str]],
    generated_at: str,
) -> str:
    first_group, second_group = report_groups
    first_group_label = format_group_label(first_group)
    second_group_label = format_group_label(second_group)

    report_content = "# A/Bテストレポート\n\n"
    report_content += f"生成日時: {generated_at}\n\n"
    report_content += "## テスト概要\n"
    report_content += f"設定ファイル: `{config_path}`\n"
    report_content += f"プロンプト言語A/Bテスト有効: {prompt_language_test_enabled}\n\n"

    for prompt_id, prompt_results in normalized_results.items():
        report_content += f"### プロンプト: {prompt_id}\n\n"

        first_run = prompt_results[first_group["id"]]["run_1"]
        second_run = prompt_results[second_group["id"]]["run_1"]
        first_metrics = extract_metrics(first_run["discussionLog"])
        second_metrics = extract_metrics(second_run["discussionLog"])

        report_content += "#### 評価指標\n"
        report_content += f"| 指標 | {first_group_label} | {second_group_label} |\n"
        report_content += "|---|---|---|\n"
        report_content += (
            f"| 総応答文字数 | {first_metrics['total_response_length']} | {second_metrics['total_response_length']} |\n"
        )
        report_content += (
            f"| 平均応答時間 (ms) | {first_metrics['avg_response_time_ms']:.2f} | "
            f"{second_metrics['avg_response_time_ms']:.2f} |\n"
        )
        report_content += f"| LLM呼び出し回数 | {first_metrics['num_llm_calls']} | {second_metrics['num_llm_calls']} |\n\n"

        report_content += "#### LLM応答比較\n"
        report_content += f"##### {first_group_label}\n"
        report_content += "```\n"
        report_content += first_run["finalOutput"] + "\n"
        report_content += "```\n\n"

        report_content += f"##### {second_group_label}\n"
        report_content += "```\n"
        report_content += second_run["finalOutput"] + "\n"
        report_content += "```\n\n"

    return report_content


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate A/B test reports for LLM prompts.")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format.")
    parser.add_argument(
        "--config",
        type=str,
        default="config/ab_test_config.json",
        help="Path to the A/B test configuration file.",
    )
    args = parser.parse_args()

    logging("--- レポート生成を開始します ---", args.json)

    config = load_config(args.config, args.json)
    user_prompt = get_first_user_prompt(config, args.json)
    report_groups = get_report_groups(config, args.json)

    evaluation_models = config.get("evaluation_models")
    if not isinstance(evaluation_models, list) or len(evaluation_models) < 2:
        evaluation_models = ["llama3:8b", "llama3:8b"]

    ab_test_runner_command = [
        "python3",
        "scripts/ab_test_runner.py",
        "--json",
        user_prompt,
        "--config",
        args.config,
        "--model1",
        evaluation_models[0],
        "--model2",
        evaluation_models[1],
    ]
    logging(f"Running A/B test command: {' '.join(ab_test_runner_command)}", args.json)

    try:
        ab_test_result = subprocess.run(
            ab_test_runner_command,
            capture_output=True,
            text=True,
            check=True,
            env=os.environ,
        )
    except subprocess.CalledProcessError as exc:
        emit_error(get_runner_failure_message(exc), args.json)
        if not args.json:
            if exc.stdout:
                logging(f"Stdout:\n{exc.stdout}", args.json)
            if exc.stderr:
                logging(f"Stderr:\n{exc.stderr}", args.json)
        raise SystemExit(1)

    try:
        normalized_results = normalize_runner_results(
            ab_test_result.stdout,
            [group["id"] for group in report_groups],
        )
    except ValueError as exc:
        fail(str(exc), args.json)

    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_content = build_report_content(
        args.config,
        bool(config.get("prompt_language_test_enabled", False)),
        normalized_results,
        report_groups,
        generated_at,
    )

    if args.json:
        json_output = {
            "report_metadata": {
                "generated_at": generated_at,
                "config_file": args.config,
                "prompt_language_test_enabled": bool(config.get("prompt_language_test_enabled", False)),
            },
            "test_results": normalized_results,
            "report_content_markdown": report_content,
        }
        print(json.dumps(json_output, indent=2, ensure_ascii=False))
        return

    print(report_content)


if __name__ == "__main__":
    main()
