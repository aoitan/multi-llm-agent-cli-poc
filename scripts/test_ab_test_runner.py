import builtins
import io
import json
import subprocess
import unittest
from unittest.mock import MagicMock, patch

from scripts.ab_test_runner import run_llm_consultation


class TestRunLlmConsultation(unittest.TestCase):
    """Tests for run_llm_consultation() to verify JSON-mode output purity."""

    def _make_called_process_error(self, returncode=1, stdout="error output", stderr="stderr output"):
        e = subprocess.CalledProcessError(returncode, ["node", "dist/index.js"])
        e.stdout = stdout
        e.stderr = stderr
        return e

    # -------------------------------------------------------------------------
    # JSON モード: 成功ケース
    # -------------------------------------------------------------------------
    @patch("scripts.ab_test_runner.subprocess.run")
    def test_json_mode_success(self, mock_run):
        """JSON mode success: parsed values returned, nothing printed to stdout."""
        mock_result = MagicMock()
        mock_result.stdout = json.dumps({"finalOutput": "summary", "discussionLog": ["entry"]})
        mock_run.return_value = mock_result

        with patch("sys.stdout", new_callable=io.StringIO) as mock_stdout:
            summary, log = run_llm_consultation("prompt", "m1", "m2", is_json=True)

        self.assertEqual(summary, "summary")
        self.assertEqual(log, ["entry"])
        # JSON モードでは logging は stdout に出さない
        self.assertEqual(mock_stdout.getvalue(), "")

    # -------------------------------------------------------------------------
    # JSON モード: subprocess.CalledProcessError
    # -------------------------------------------------------------------------
    @patch("scripts.ab_test_runner.subprocess.run")
    def test_json_mode_subprocess_error_no_garbage(self, mock_run):
        """JSON mode + CalledProcessError: re-raises, nothing printed to stdout."""
        mock_run.side_effect = self._make_called_process_error()

        with patch("sys.stdout", new_callable=io.StringIO) as mock_stdout:
            with self.assertRaises(subprocess.CalledProcessError):
                run_llm_consultation("prompt", "m1", "m2", is_json=True)

        output = mock_stdout.getvalue()
        self.assertNotIn("True", output)
        self.assertEqual(output, "")

    # -------------------------------------------------------------------------
    # JSON モード: json.JSONDecodeError
    # -------------------------------------------------------------------------
    @patch("scripts.ab_test_runner.subprocess.run")
    def test_json_mode_json_decode_error_no_garbage(self, mock_run):
        """JSON mode + JSONDecodeError: re-raises, nothing printed to stdout."""
        mock_result = MagicMock()
        mock_result.stdout = "not valid json"
        mock_run.return_value = mock_result

        with patch("sys.stdout", new_callable=io.StringIO) as mock_stdout:
            with self.assertRaises(json.JSONDecodeError):
                run_llm_consultation("prompt", "m1", "m2", is_json=True)

        output = mock_stdout.getvalue()
        self.assertNotIn("True", output)
        self.assertEqual(output, "")

    # -------------------------------------------------------------------------
    # 非 JSON モード: 成功ケース
    # -------------------------------------------------------------------------
    @patch("scripts.ab_test_runner.subprocess.run")
    def test_non_json_mode_success(self, mock_run):
        """Non-JSON mode success: 'Running command' log appears, no 'False' appended."""
        mock_result = MagicMock()
        mock_result.stdout = json.dumps({"finalOutput": "summary", "discussionLog": []})
        mock_run.return_value = mock_result

        with patch("sys.stdout", new_callable=io.StringIO) as mock_stdout:
            summary, log = run_llm_consultation("prompt", "m1", "m2", is_json=False)

        output = mock_stdout.getvalue()
        self.assertEqual(summary, "summary")
        self.assertEqual(log, [])
        self.assertIn("Running command", output)
        self.assertNotIn("False", output)

    # -------------------------------------------------------------------------
    # 非 JSON モード: subprocess.CalledProcessError
    # -------------------------------------------------------------------------
    @patch("scripts.ab_test_runner.subprocess.run")
    def test_non_json_mode_subprocess_error_no_garbage(self, mock_run):
        """Non-JSON mode + CalledProcessError: error message shown, 'False' NOT appended."""
        mock_run.side_effect = self._make_called_process_error(returncode=1)

        with patch("sys.stdout", new_callable=io.StringIO) as mock_stdout:
            with self.assertRaises(subprocess.CalledProcessError):
                run_llm_consultation("prompt", "m1", "m2", is_json=False)

        output = mock_stdout.getvalue()
        # エラーメッセージが表示されること
        self.assertIn("Error", output)
        # 現行バグ: print(msg, False) が "Error... False" を出力してしまう
        self.assertNotIn("False", output)


class TestAbTestRunnerMainJson(unittest.TestCase):
    """main() が JSON モードで正しいエラー JSON を出力することを検証する統合テスト。"""

    BASE_CONFIG = {
        "dynamic_prompt_ab_test_enabled": True,
        "test_prompts": [
            {"id": "p1", "user_prompt": "hello", "expected_scenario_id": "s1"}
        ],
        "test_groups": [
            {
                "id": "g1",
                "type": "static",
                "prompt_file_path": "prompts/foo.json",
                "workflow_id": "wf1",
                "prompt_language": "japanese",
            }
        ],
        "evaluation_models": ["m1", "m2"],
    }

    def _make_open_side_effect(self, config_json: str, template: str = "tpl"):
        """builtins.open のモック: パスに応じて config / template の内容を返す。
        認識外のパス（gettext など）は実際の open に委譲する。
        """
        _real_open = builtins.open

        def side_effect(path, *args, **kwargs):
            path_str = str(path)
            if "evaluation_prompt_template" in path_str:
                content = template
            elif path_str.endswith(".json") or "config" in path_str:
                content = config_json
            else:
                return _real_open(path, *args, **kwargs)
            m = MagicMock()
            m.__enter__ = MagicMock(return_value=io.StringIO(content))
            m.__exit__ = MagicMock(return_value=False)
            return m

        return side_effect

    def _run_main_json(self, subproc_side_effect=None, config_exists=True):
        """JSON モードで main() を実行し、(stdout出力, 終了コード) を返す。"""
        config_json = json.dumps(self.BASE_CONFIG)

        def mock_exists(path):
            if "evaluation_prompt_template" in str(path):
                return True
            return config_exists

        with patch("scripts.ab_test_runner.os.path.exists", side_effect=mock_exists), \
             patch("builtins.open", side_effect=self._make_open_side_effect(config_json)), \
             patch("scripts.ab_test_runner.subprocess.run", side_effect=subproc_side_effect), \
             patch("sys.argv", ["ab.py", "hello", "--json", "--config", "config.json"]):
            captured = io.StringIO()
            with patch("sys.stdout", captured):
                try:
                    from scripts.ab_test_runner import main
                    main()
                    return captured.getvalue(), None
                except SystemExit as e:
                    return captured.getvalue(), e.code

    def test_json_mode_subprocess_error_emits_error_json(self):
        """main() + --json + CalledProcessError → {"error": {...}} が stdout に出力され exit 1。"""
        err = subprocess.CalledProcessError(1, ["node"], output="", stderr="err")
        output, exit_code = self._run_main_json(subproc_side_effect=err)

        self.assertEqual(exit_code, 1, "終了コードが 1 でなければならない")
        output = output.strip()
        self.assertTrue(len(output) > 0, "JSON モードのエラー時に stdout が空")
        parsed = json.loads(output)  # 有効な JSON でなければ ValueError
        self.assertIn("error", parsed)

    def test_json_mode_missing_config_emits_error_json(self):
        """main() + --json + 設定ファイル不在 → {"error": {...}} が stdout に出力され非0終了。"""
        output, exit_code = self._run_main_json(config_exists=False)

        self.assertIsNotNone(exit_code, "SystemExit が発生しなかった")
        self.assertNotEqual(exit_code, 0, "終了コードが 0 であってはならない")
        output = output.strip()
        self.assertTrue(len(output) > 0, "JSON モードのエラー時に stdout が空")
        parsed = json.loads(output)
        self.assertIn("error", parsed)


if __name__ == "__main__":
    unittest.main()
