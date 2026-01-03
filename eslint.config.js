export default [
    {
        ignores: ["dist/**", "node_modules/**"]
    },
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                performance: "readonly",
                requestAnimationFrame: "readonly",
                alert: "readonly",
                setTimeout: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    }
];
