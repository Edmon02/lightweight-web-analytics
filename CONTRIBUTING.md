# Contributing to Lightweight Web Analytics

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide the following information:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the TypeScript styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

1. Fork the repo
2. Create a new branch
3. Make your changes
4. Run tests and linting
5. Push your changes
6. Create a Pull Request

## Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/lightweight-web-analytics.git

# Install dependencies
bun install --frozen-lockfile

# Setup database
bun run db:setup

# Start development server
bun dev
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch
```

Note: We use Vitest with Bun for faster test execution and better developer experience.

Thank you for contributing! 🙌
