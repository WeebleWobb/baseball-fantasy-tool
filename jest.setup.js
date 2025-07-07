// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill Request for Node.js test environment (used in API route tests)
global.Request = class Request {
  constructor(url, init = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers || {})
    this.body = init.body
  }
}

// Polyfill Headers for Node.js test environment (used with Request)
global.Headers = class Headers {
  constructor(init = {}) {
    this.headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }
  
  get(name) {
    return this.headers.get(name.toLowerCase())
  }
  
  set(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }
  
  has(name) {
    return this.headers.has(name.toLowerCase())
  }
}