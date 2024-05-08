module.exports = {
    "presets": [
        [
            "@babel/preset-env",
            {
                "targets": {
                    "node": "current"
                }
            }
        ],
        "@babel/preset-typescript",
    ],
    "plugins": [
        [
            "@babel/plugin-proposal-decorators",
            {
                "version": "2023-05"
            }
        ]
    ]
};