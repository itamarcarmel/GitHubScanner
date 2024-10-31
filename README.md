# GitHub Scanner

A Graphql server app which scans a github account

## Table of Contents

- [Installation](#installation)
- [Running](#running)
- [TODO](#TODO)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/itamarcarmel/GitHubScanner.git
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Build project:
    ```bash
    npm run build
    ```

## Running

1. Run the server:
    ```bash
    npm run run
    ```
2. Open http://localhost:4000/ on browser (it will redirect to Apollo sandbox)

## TODO

1. Add graphql authentication and authorization (JWT - can embed the token and username for the github account)
2. Separate the "repositoryDetails" into two queries - one for real-time descriptive data and the other for scanning result
3. Consider instead of synchronized scan query a different approach, such as creating a process with id and the client will poll it or will be notified with registered webhook
4. Error handling - catch and transform to graphql types (union of errors)
5. Remove REST requests (for webhooks querying) and replace with graphql (didn't find one) - for consistency
6. Add "axios-retry" lib for rate limiting - use exponential backoff or keep track of traffic usage
7. Consider caching by persisting the commit hash of each repo (to prevent redundant scans)
8. Consider using data loader approach (by batching graphql requests - if possible)
9. Consider queue-based approach for sequential execution of the graphql querying (maybe Bull)
10. Use pagination for entries and other "array-like" data
