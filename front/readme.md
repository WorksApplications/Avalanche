# DYNAMIC analysis / frontend

# Tech stack

*Be Professional*

## Main Library

+ React + Redux
  + react
  + redux
  + react-redux
  + react-router
  + redux-thunk
  + typescript-fsa
+ TypeScript 3.x
  + ts-lint
  + babel
+ CSS Modules
  + SCSS

## Tool

+ Webpack 4+ (with webpack-dev-server)
+ Prettier
+ Jest
  + babel-jest
  + Enzyme

# Start developing

Assuming you use `http://localhost:5000` as an API,

```bash
$ yarn start --env.API_BASE_URL=http://localhost:5000
```

# Build for distribute

```bash
$ yarn build --env.API_BASE_URL=http://localhost:5000
```

This command generates "public" directory and files.