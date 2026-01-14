// eslint.config.js
import stylistic from '@stylistic/eslint-plugin';
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import perf from "eslint-plugin-react-perf";
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
            "react-perf": perf,
            "react-refresh": refresh,
            '@stylistic': stylistic,
        },
        languageOptions: {
            ...reactRecommended.languageOptions,
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            ...reactRecommended.rules,
            "@stylistic/max-len": ["warn", {
                "code": 120,
                "ignoreComments": false,
                "ignorePattern": "^import ",
            }],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/semi": "error",
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
            "no-restricted-imports": [
                "error",
                {
                    "paths": [
                        {
                            "name": "@mui/material",
                            "message": "See https://mui.com/material-ui/guides/minimizing-bundle-size/#avoid-barrel-imports",
                        },
                    ],
                }
            ],
            "prefer-rest-params": "off",
            "react/prop-types": "off",
            "react/react-in-jsx-scope": "off",
            "react-hooks/exhaustive-deps": ["error", {
                "additionalHooks": "(useFabProps)",
            }],
            "react-perf/jsx-no-new-array-as-prop": "error",
            "react-perf/jsx-no-new-function-as-prop": "error",
            "react-perf/jsx-no-new-object-as-prop": "error",
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
        },
    }
);
