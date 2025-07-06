# CI/CD Pipeline Setup

This project uses GitHub Actions for continuous integration and deployment, ensuring code quality and preventing broken code from reaching the main branch.

## 🚀 Workflows Overview

### 1. Main CI/CD Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- **Test Suite**: Runs tests across Node.js 18.x and 20.x
- **Build Check**: Verifies the application builds successfully
- **Security Audit**: Checks for security vulnerabilities

**What it does:**
- ✅ Runs ESLint for code quality
- ✅ Performs TypeScript type checking
- ✅ Executes full test suite with coverage
- ✅ Uploads coverage reports to Codecov
- ✅ Builds the Next.js application
- ✅ Runs security audit for dependencies

### 2. PR Validation (`.github/workflows/pr-checks.yml`)

Focused validation for pull requests with automatic commenting.

**Features:**
- Runs all quality checks in sequence
- Enforces 80% test coverage threshold
- Comments on PRs with results
- Only runs on non-draft PRs

## 📋 Required Checks

Before any PR can be merged, it must pass:

1. **Linting** - ESLint with Next.js configuration
2. **Type Checking** - TypeScript compilation without errors
3. **Unit Tests** - All tests must pass
4. **Coverage Threshold** - Minimum 80% line coverage
5. **Build Verification** - Application must build successfully
6. **Security Audit** - No high-severity vulnerabilities

## 🛠️ Setting Up Branch Protection

To enforce these checks, set up branch protection rules in your GitHub repository:

### Step 1: Go to Repository Settings
1. Navigate to your GitHub repository
2. Click on **Settings** tab
3. Go to **Branches** in the left sidebar

### Step 2: Add Branch Protection Rule
1. Click **Add rule**
2. Set **Branch name pattern** to `main`
3. Enable these options:

```
☑️ Require a pull request before merging
☑️ Require status checks to pass before merging
☑️ Require branches to be up to date before merging
☑️ Require conversation resolution before merging
☑️ Restrict pushes that create files larger than 100MB
☑️ Do not allow bypassing the above settings
```

### Step 3: Required Status Checks
Add these required status checks:
- `Test Suite (18.x)`
- `Test Suite (20.x)` 
- `Build Check`
- `Security Audit`
- `Validate PR`

## 🔧 Local Development Commands

These are the same commands used in CI:

```bash
# Run linter
npm run lint

# Type checking
npm run type-check

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build application
npm run build

# Security audit
npm audit
```

## 📊 Coverage Reports

Coverage reports are automatically:
- Generated on every test run
- Uploaded to Codecov (if configured)
- Checked against 80% threshold
- Displayed in PR comments

### Coverage Configuration

The coverage threshold is enforced in:
- `jest.config.js` - Local development
- `.github/workflows/pr-checks.yml` - CI/CD pipeline

To adjust the threshold, update both files.

## 🚨 Handling CI Failures

### Test Failures
```bash
# Run tests locally to debug
npm test

# Run specific test file
npm test -- src/__tests__/path/to/test.test.tsx

# Run tests in watch mode
npm run test:watch
```

### Linting Errors
```bash
# Check linting issues
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

### Type Errors
```bash
# Check TypeScript errors
npm run type-check

# Use TypeScript in watch mode
npx tsc --noEmit --watch
```

### Build Failures
```bash
# Test build locally
npm run build

# Check for build errors
npm run build 2>&1 | grep -i error
```

## 🔄 Workflow Triggers

### CI Pipeline (`ci.yml`)
- **Push** to `main` or `develop`
- **Pull Request** to `main` or `develop`

### PR Validation (`pr-checks.yml`)
- **Pull Request** opened
- **Pull Request** synchronized (new commits)
- **Pull Request** reopened
- **Pull Request** marked ready for review

## 📈 Best Practices

1. **Write Tests First** - Follow TDD for new features
2. **Keep Coverage High** - Aim for >80% coverage
3. **Fix CI Immediately** - Don't let broken CI linger
4. **Use Draft PRs** - For work-in-progress to avoid CI runs
5. **Small PRs** - Easier to review and debug CI issues

## 🔧 Customization

### Adjusting Node.js Versions
Edit the matrix in `ci.yml`:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add more versions
```

### Changing Coverage Threshold
Update in both:
- `jest.config.js`: `coverageThreshold`
- `pr-checks.yml`: `threshold` variable

### Adding More Checks
Add steps to the workflows:
```yaml
- name: Custom Check
  run: npm run custom-script
```

## 🎯 Goals

This CI/CD setup ensures:
- ✅ **Code Quality** - Consistent formatting and no type errors
- ✅ **Test Coverage** - High confidence in functionality
- ✅ **Security** - No known vulnerabilities
- ✅ **Buildability** - Application always builds successfully
- ✅ **Team Collaboration** - Clear feedback on PR status

The pipeline is designed to catch issues early and provide fast feedback to developers. 