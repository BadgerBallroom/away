// eslint.config.js
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import refresh from "eslint-plugin-react-refresh";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
    {
        ignores: ["dist/"],
    },
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
        plugins: {
            react: react,
            "react-hooks": hooks,
            "react-refresh": refresh,
        },
        languageOptions: {
            ...reactRecommended.languageOptions,
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            ...reactRecommended.rules,
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    "args": "all",
                    "argsIgnorePattern": "^_",
                    "caughtErrors": "all",
                    "caughtErrorsIgnorePattern": "^_",
                    "destructuredArrayIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                }
            ],
            "prefer-rest-params": "off",
            "react/jsx-key": "warn",
            "react/prop-types": "off",
            "react/react-in-jsx-scope": "off",
            "react-hooks/exhaustive-deps": "error",
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
        },
    }
);
