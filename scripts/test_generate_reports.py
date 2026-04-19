import io
import json
import os
import subprocess
import unittest
from unittest.mock import MagicMock, patch

from scripts.generate_reports import extract_metrics, main


class TestGenerateReports(unittest.TestCase):
    def setUp(self):
        self.test_config_path = "test_ab_test_config.json"
        self.base_config = {
            "dynamic_prompt_ab_test_enabled": True,
            "prompt_language_test_enabled": True,
            "test_prompts": [
                {
                    "id": "PROMPT_1_SOCIAL_ISSUES",
                    "user_prompt": "日本の高齢化社会における介護人材不足の解決策を3つ提案してください。",
                    "expected_scenario_id": "social_issues",
                }
            ],
            "test_groups": [
                {
                    "id": "control",
                    "type": "static",
                    "prompt_file_path": "prompts/default_prompts.json",
                    "workflow_id": "code_review_and_refactor",
                    "prompt_language": "japanese",
                },
                {
                    "id": "dynamic_prompt_group",
                    "type": "dynamic",
                    "scenario_based_workflow_selection_enabled": True,
                    "prompt_language": "english",
                },
            ],
            "evaluation_models": ["llama3:8b", "llama3:8b"],
        }
        self.write_config(self.base_config)

    def tearDown(self):
        if os.path.exists(self.test_config_path):
            os.remove(self.test_config_path)

    def write_config(self, config_data):
        with open(self.test_config_path, "w", encoding="utf-8") as f:
            json.dump(config_data, f, ensure_ascii=False)

    def run_main(self, argv, mock_stdout=None, side_effect=None):
        if mock_stdout is None:
            mock_result = MagicMock()
            mock_result.stdout = json.dumps(
                {
                    "PROMPT_1_SOCIAL_ISSUES": {
                        "control": {
                            "run_1": {
                                "finalOutput": json.dumps("日本語の最終出力です。", ensure_ascii=False),
                                "discussionLog": [
                                    {"response_received": "Ollama API call to llama3:8b took 100.00 ms"},
                                    {"response_received": "日本語の応答です。"},
                                ],
                            }
                        },
                        "dynamic_prompt_group": {
                            "run_1": {
                                "finalOutput": json.dumps("This is the final output in English."),
                                "discussionLog": [
                                    {"response_received": "Ollama API call to llama3:8b took 150.00 ms"},
                                    {"response_received": "English response."},
                                ],
                            }
                        },
                    }
                },
                ensure_ascii=False,
            )
        else:
            mock_result = MagicMock()
            mock_result.stdout = mock_stdout

        with patch("scripts.generate_reports.subprocess.run") as mock_run, patch(
            "sys.argv", ["scripts/generate_reports.py", *argv]
        ):
            if side_effect is not None:
                mock_run.side_effect = side_effect
            else:
                mock_run.return_value = mock_result

            captured = io.StringIO()
            with patch("sys.stdout", captured):
                try:
                    main()
                    exit_code = None
                except SystemExit as exc:
                    exit_code = exc.code

        return captured.getvalue(), exit_code, mock_run

    def test_report_generation_uses_normalized_outputs(self):
        output, exit_code, _ = self.run_main(["--config", self.test_config_path])

        self.assertIsNone(exit_code)
        self.assertIn("# A/Bテストレポート", output)
        self.assertIn(f"設定ファイル: `{self.test_config_path}`", output)
        self.assertIn("| 指標 | Control Group (日本語) | Dynamic Prompt Group (英語) |", output)
        self.assertIn("日本語の最終出力です。", output)
        self.assertIn("This is the final output in English.", output)
        self.assertNotIn('"日本語の最終出力です。"', output)

    def test_json_mode_success_returns_normalized_results(self):
        output, exit_code, _ = self.run_main(["--json", "--config", self.test_config_path])

        self.assertIsNone(exit_code)
        payload = json.loads(output)
        normalized_results = payload["test_results"]["PROMPT_1_SOCIAL_ISSUES"]
        self.assertEqual(normalized_results["control"]["run_1"]["finalOutput"], "日本語の最終出力です。")
        self.assertEqual(
            normalized_results["dynamic_prompt_group"]["run_1"]["finalOutput"],
            "This is the final output in English.",
        )
        self.assertIn("日本語の最終出力です。", payload["report_content_markdown"])
        self.assertIn("This is the final output in English.", payload["report_content_markdown"])

    def test_missing_test_prompts_json_mode(self):
        config_without_prompts = dict(self.base_config)
        config_without_prompts["test_prompts"] = []
        self.write_config(config_without_prompts)

        output, exit_code, mock_run = self.run_main(["--json", "--config", self.test_config_path])

        mock_run.assert_not_called()
        self.assertEqual(exit_code, 1)
        self.assertEqual(
            json.loads(output),
            {"error": {"message": "Error: 'test_prompts' not found or empty in config. Exiting."}},
        )

    def test_missing_config_json_mode(self):
        missing_path = "does-not-exist.json"
        output, exit_code, mock_run = self.run_main(["--json", "--config", missing_path])

        mock_run.assert_not_called()
        self.assertEqual(exit_code, 1)
        self.assertEqual(
            json.loads(output),
            {"error": {"message": f"Error: Config file not found: {missing_path}. Exiting."}},
        )

    def test_runner_error_envelope_json_mode(self):
        output, exit_code, _ = self.run_main(
            ["--json", "--config", self.test_config_path],
            mock_stdout=json.dumps({"error": {"message": "runner failed"}}, ensure_ascii=False),
        )

        self.assertEqual(exit_code, 1)
        self.assertEqual(
            json.loads(output),
            {"error": {"message": "A/B test runner reported an error: runner failed"}},
        )

    def test_runner_invalid_json_json_mode(self):
        output, exit_code, _ = self.run_main(
            ["--json", "--config", self.test_config_path],
            mock_stdout="not valid json",
        )

        self.assertEqual(exit_code, 1)
        self.assertEqual(
            json.loads(output),
            {"error": {"message": "Failed to parse A/B test results as JSON."}},
        )

    def test_runner_malformed_success_shape_json_mode(self):
        malformed_payload = {
            "PROMPT_1_SOCIAL_ISSUES": {
                "control": {
                    "run_1": {
                        "finalOutput": json.dumps("日本語の最終出力です。", ensure_ascii=False),
                        "discussionLog": [],
                    }
                }
            }
        }
        output, exit_code, _ = self.run_main(
            ["--json", "--config", self.test_config_path],
            mock_stdout=json.dumps(malformed_payload, ensure_ascii=False),
        )

        self.assertEqual(exit_code, 1)
        self.assertEqual(
            json.loads(output),
            {
                "error": {
                    "message": (
                        "Missing test group 'dynamic_prompt_group' in results for prompt "
                        "'PROMPT_1_SOCIAL_ISSUES'."
                    )
                }
            },
        )

    def test_runner_subprocess_failure_json_mode(self):
        error = subprocess.CalledProcessError(3, ["python3", "scripts/ab_test_runner.py"], output="", stderr="boom")
        output, exit_code, _ = self.run_main(
            ["--json", "--config", self.test_config_path],
            side_effect=error,
        )

        self.assertEqual(exit_code, 1)
        self.assertEqual(
            json.loads(output),
            {"error": {"message": "A/B test runner failed with exit code 3."}},
        )

    def test_runner_subprocess_failure_with_error_json_mode(self):
        error = subprocess.CalledProcessError(
            1,
            ["python3", "scripts/ab_test_runner.py"],
            output=json.dumps({"error": {"message": "runner failed"}}, ensure_ascii=False),
            stderr="boom",
        )
        output, exit_code, _ = self.run_main(
            ["--json", "--config", self.test_config_path],
            side_effect=error,
        )

        self.assertEqual(exit_code, 1)
        self.assertEqual(
            json.loads(output),
            {"error": {"message": "A/B test runner reported an error: runner failed"}},
        )

    def test_extract_metrics(self):
        response1_content = "Response 1. Ollama API call to llama3:8b took 100.50 ms"
        response2_content = "Response 2. Ollama API call to llama3:8b took 200.50 ms"
        response3_content = "Response 3. No time here."

        log = [
            {"response_received": response1_content},
            {"response_received": response2_content},
            {"response_received": response3_content},
        ]
        metrics = extract_metrics(log)
        self.assertEqual(
            metrics["total_response_length"],
            len(response1_content) + len(response2_content) + len(response3_content),
        )
        self.assertAlmostEqual(metrics["avg_response_time_ms"], 150.50)
        self.assertEqual(metrics["num_llm_calls"], 2)

        metrics_no_llm = extract_metrics([{"response_received": "Just a response."}])
        self.assertEqual(metrics_no_llm["avg_response_time_ms"], 0)
        self.assertEqual(metrics_no_llm["num_llm_calls"], 0)


if __name__ == "__main__":
    unittest.main()
