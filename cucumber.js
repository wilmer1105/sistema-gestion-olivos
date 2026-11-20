// cucumber.js
module.exports = {
  default: {
    requireModule: [
      'ts-node/register',
      'tsconfig-paths/register'
    ],
    require: ['tests/features/step_definitions/**/*.steps.ts'],
    paths: ['tests/features/**/*.feature'],
    format: ['progress-bar', 'summary'],
  },
}