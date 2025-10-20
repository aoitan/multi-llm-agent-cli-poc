import unittest
import os
import json
from unittest.mock import patch, MagicMock
from scripts.generate_reports import main, extract_metrics # main関数とextract_metrics関数をインポート

class TestGenerateReports(unittest.TestCase):

    def setUp(self):
        # テスト用の設定ファイルを作成
        self.test_config_path = "test_ab_test_config.json"
        self.test_results_path = "test_ab_test_results.json"
        self.original_config_content = {
            "dynamic_prompt_ab_test_enabled": True,
            "prompt_language_test_enabled": True,
            "test_prompts": [
                {
                    "id": "PROMPT_1_SOCIAL_ISSUES",
                    "user_prompt": "日本の高齢化社会における介護人材不足の解決策を3つ提案してください。",
                    "expected_scenario_id": "social_issues"
                }
            ],
            "test_groups": [
                {
                    "id": "control",
                    "type": "static",
                    "prompt_file_path": "prompts/default_prompts.json",
                    "workflow_id": "code_review_and_refactor",
                    "prompt_language": "japanese"
                },
                {
                    "id": "dynamic_prompt_group",
                    "type": "dynamic",
                    "scenario_based_workflow_selection_enabled": True,
                    "prompt_language": "english"
                }
            ],
            "evaluation_models": ["llama3:8b", "llama3:8b"]
        }
        with open(self.test_config_path, 'w', encoding='utf-8') as f:
            json.dump(self.original_config_content, f)

        # テスト用のab_test_runner.pyの出力（ダミー）を作成
        self.mock_ab_test_runner_output = {
            "PROMPT_1_SOCIAL_ISSUES": {
                "control": {
                    "run_1": {
                        "finalOutput": "日本語の最終出力です。",
                        "discussionLog": [
                            {"response_received": "Ollama API call to llama3:8b took 100.00 ms"},
                            {"response_received": "日本語の応答です。"}
                        ]
                    }
                },
                "dynamic_prompt_group": {
                    "run_1": {
                        "finalOutput": "This is the final output in English.",
                        "discussionLog": [
                            {"response_received": "Ollama API call to llama3:8b took 150.00 ms"},
                            {"response_received": "English response."}
                        ]
                    }
                }
            }
        }
        with open(self.test_results_path, 'w', encoding='utf-8') as f:
            json.dump(self.mock_ab_test_runner_output, f)

    def tearDown(self):
        # テスト用ファイルを削除
        os.remove(self.test_config_path)
        os.remove(self.test_results_path)

    @patch('scripts.generate_reports.subprocess.run')
    @patch('scripts.generate_reports.json.loads')
    @patch('scripts.generate_reports.os.path.exists')
    @patch('builtins.open', new_callable=unittest.mock.mock_open)
    def test_report_generation(self, mock_open, mock_exists, mock_json_loads, mock_subprocess_run):
        # subprocess.runのモック設定
        mock_subprocess_run.return_value = MagicMock(stdout=json.dumps(self.mock_ab_test_runner_output), returncode=0)
        
        # os.path.existsのモック設定
        mock_exists.side_effect = lambda x: x == self.test_config_path or x == "prompts/evaluation_prompt_template.md"

        # json.loadsのモック設定
        mock_json_loads.side_effect = [self.original_config_content, self.mock_ab_test_runner_output]

        # main関数を実行
        with patch('sys.argv', ['scripts/generate_reports.py', '--config', self.test_config_path]):
            with patch('builtins.print') as mock_print: # print関数をモック
                main()
                
                # printの呼び出し内容を検証
                printed_output = "".join([call.args[0] for call in mock_print.call_args_list])
                
                self.assertIn("# A/Bテストレポート", printed_output)
                self.assertIn("## テスト概要", printed_output)
                self.assertIn(f"設定ファイル: `{self.test_config_path}`", printed_output)
                self.assertIn("プロンプト言語A/Bテスト有効: True", printed_output)
                self.assertIn("### プロンプト: PROMPT_1_SOCIAL_ISSUES", printed_output)
                self.assertIn("#### 評価指標", printed_output)
                self.assertIn("| 指標 | Control Group (日本語) | Dynamic Prompt Group (英語) |", printed_output)
                self.assertIn("|---|---|---|", printed_output)
                
                # 応答メトリクスの期待値を算出
                control_metrics = extract_metrics(
                    self.mock_ab_test_runner_output["PROMPT_1_SOCIAL_ISSUES"]["control"]["run_1"]["discussionLog"]
                )
                dynamic_metrics = extract_metrics(
                    self.mock_ab_test_runner_output["PROMPT_1_SOCIAL_ISSUES"]["dynamic_prompt_group"]["run_1"]["discussionLog"]
                )

                self.assertIn(
                    f"| 総応答文字数 | {control_metrics['total_response_length']} | {dynamic_metrics['total_response_length']} |",
                    printed_output
                )
                self.assertIn("| 平均応答時間 (ms) | 100.00 | 150.00 |", printed_output)
                self.assertIn("| LLM呼び出し回数 | 1 | 1 |", printed_output)
                self.assertIn("#### LLM応答比較", printed_output)
                self.assertIn("##### Control Group (日本語)", printed_output)
                self.assertIn("日本語の最終出力です。", printed_output)
                self.assertIn("##### Dynamic Prompt Group (英語)", printed_output)
                self.assertIn("This is the final output in English.", printed_output)

    @patch('scripts.generate_reports.subprocess.run')
    def test_missing_test_prompts_non_json(self, mock_subprocess_run):
        config_without_prompts = dict(self.original_config_content)
        config_without_prompts["test_prompts"] = []
        with open(self.test_config_path, 'w', encoding='utf-8') as f:
            json.dump(config_without_prompts, f)

        with patch('sys.argv', ['scripts/generate_reports.py', '--config', self.test_config_path]):
            with patch('builtins.print') as mock_print:
                main()

        mock_subprocess_run.assert_not_called()
        printed_output = " ".join(call.args[0] for call in mock_print.call_args_list)
        self.assertIn("Error: 'test_prompts' not found or empty in config. Exiting.", printed_output)

    @patch('scripts.generate_reports.subprocess.run')
    def test_missing_test_prompts_json_mode(self, mock_subprocess_run):
        config_without_prompts = dict(self.original_config_content)
        config_without_prompts["test_prompts"] = []
        with open(self.test_config_path, 'w', encoding='utf-8') as f:
            json.dump(config_without_prompts, f)

        with patch('sys.argv', ['scripts/generate_reports.py', '--json', '--config', self.test_config_path]):
            with patch('builtins.print') as mock_print:
                main()

        mock_subprocess_run.assert_not_called()
        self.assertEqual(len(mock_print.call_args_list), 1)
        error_payload = mock_print.call_args_list[0].args[0]
        error_json = json.loads(error_payload)
        self.assertEqual(
            error_json,
            {"error": {"message": "Error: 'test_prompts' not found or empty in config. Exiting."}}
        )

    @patch('scripts.generate_reports.subprocess.run')
    def test_first_prompt_not_dict(self, mock_subprocess_run):
        config_with_invalid_prompt = dict(self.original_config_content)
        config_with_invalid_prompt["test_prompts"] = ["not-a-dict"]
        with open(self.test_config_path, 'w', encoding='utf-8') as f:
            json.dump(config_with_invalid_prompt, f)

        with patch('sys.argv', ['scripts/generate_reports.py', '--config', self.test_config_path]):
            with patch('builtins.print') as mock_print:
                main()

        mock_subprocess_run.assert_not_called()
        printed_output = " ".join(call.args[0] for call in mock_print.call_args_list)
        self.assertIn("Error: The first entry in 'test_prompts' must be an object with prompt metadata.", printed_output)

    @patch('scripts.generate_reports.subprocess.run')
    def test_missing_user_prompt_key(self, mock_subprocess_run):
        config_with_bad_prompt = dict(self.original_config_content)
        config_with_bad_prompt["test_prompts"] = [{"id": "bad_prompt"}]
        with open(self.test_config_path, 'w', encoding='utf-8') as f:
            json.dump(config_with_bad_prompt, f)

        with patch('sys.argv', ['scripts/generate_reports.py', '--config', self.test_config_path]):
            with patch('builtins.print') as mock_print:
                main()

        mock_subprocess_run.assert_not_called()
        printed_output = " ".join(call.args[0] for call in mock_print.call_args_list)
        self.assertIn("Error: The first entry in 'test_prompts' must include a non-empty user_prompt.", printed_output)

    @patch('scripts.generate_reports.subprocess.run')
    def test_blank_user_prompt_string_json_mode(self, mock_subprocess_run):
        config_with_blank_prompt = dict(self.original_config_content)
        config_with_blank_prompt["test_prompts"] = [{"id": "blank_prompt", "user_prompt": "   "}]
        with open(self.test_config_path, 'w', encoding='utf-8') as f:
            json.dump(config_with_blank_prompt, f)

        with patch('sys.argv', ['scripts/generate_reports.py', '--json', '--config', self.test_config_path]):
            with patch('builtins.print') as mock_print:
                main()

        mock_subprocess_run.assert_not_called()
        self.assertEqual(len(mock_print.call_args_list), 1)
        error_payload = mock_print.call_args_list[0].args[0]
        error_json = json.loads(error_payload)
        self.assertEqual(
            error_json,
            {"error": {"message": "Error: The first entry in 'test_prompts' must include a non-empty user_prompt."}}
        )

    def test_extract_metrics(self):
        response1_content = "Response 1. Ollama API call to llama3:8b took 100.50 ms"
        response2_content = "Response 2. Ollama API call to llama3:8b took 200.50 ms"
        response3_content = "Response 3. No time here."
        
        log = [
            {"response_received": response1_content},
            {"response_received": response2_content},
            {"response_received": response3_content}
        ]
        metrics = extract_metrics(log)
        self.assertEqual(metrics["total_response_length"], len(response1_content) + len(response2_content) + len(response3_content))
        self.assertAlmostEqual(metrics["avg_response_time_ms"], 150.50)
        self.assertEqual(metrics["num_llm_calls"], 2)

        # LLM呼び出しがない場合
        response_no_llm_content = "Just a response."
        log_no_llm = [
            {"response_received": response_no_llm_content}
        ]
        metrics_no_llm = extract_metrics(log_no_llm)
        self.assertEqual(metrics_no_llm["total_response_length"], len(response_no_llm_content))
        self.assertEqual(metrics_no_llm["avg_response_time_ms"], 0)
        self.assertEqual(metrics_no_llm["num_llm_calls"], 0)

if __name__ == '__main__':
    unittest.main()
