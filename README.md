# Case Law Access Project API

A GraphQL API for accessing and managing case law data, built with Apollo Server and TypeScript.

## Overview

This API provides comprehensive access to case law data including cases, courts, and jurisdictions. The schema is designed to handle complex legal data structures with proper relationships and search capabilities.

## GraphQL Schema

### Main Types

#### Case

The primary entity representing a legal case with all its metadata and content.

```graphql
type Case {
  id: ID!
  name: String
  name_abbreviation: String
  decision_date: String
  docket_number: String
  first_page: String
  last_page: String
  citations: [Citation]
  court: Court
  jurisdiction: Jurisdiction
  cites_to: [CitesTo]
  analysis: Analysis
  last_updated: DateTime
  provenance: Provenance
  casebody: CaseBody
  file_name: String
  first_page_order: Int
  last_page_order: Int
}
```

#### Court

Represents a court that issued the case.

```graphql
type Court {
  id: ID!
  name_abbreviation: String
  name: String
}
```

#### Jurisdiction

Represents the legal jurisdiction (state, federal, etc.).

```graphql
type Jurisdiction {
  id: ID!
  name_long: String
  name: String
}
```

### Queries

#### Case Queries

- `GetAllCases`: Retrieve all cases
- `GetCaseById(id: ID!)`: Get a specific case by ID
- `GetCasesByCourt(courtId: ID!)`: Get all cases from a specific court
- `GetCasesByJurisdiction(jurisdictionId: ID!)`: Get all cases from a specific jurisdiction
- `GetCasesByDateRange(startDate: String!, endDate: String!)`: Get cases within a date range
- `SearchCases(query: String!)`: Search cases by name, abbreviation, or docket number

#### Court Queries

- `GetAllCourts`: Retrieve all courts
- `GetCourtById(id: ID!)`: Get a specific court by ID

#### Jurisdiction Queries

- `GetAllJurisdictions`: Retrieve all jurisdictions
- `GetJurisdictionById(id: ID!)`: Get a specific jurisdiction by ID

### Mutations

#### Case Mutations

- `InsertCase(input: CaseInput!)`: Create a new case
- `UpdateCase(id: ID!, input: CaseInput!)`: Update an existing case
- `DeleteCase(id: ID!)`: Delete a case

#### Court Mutations

- `InsertCourt(input: CourtInput!)`: Create a new court
- `UpdateCourt(id: ID!, input: CourtInput!)`: Update an existing court
- `DeleteCourt(id: ID!)`: Delete a court

#### Jurisdiction Mutations

- `InsertJurisdiction(input: JurisdictionInput!)`: Create a new jurisdiction
- `UpdateJurisdiction(id: ID!, input: JurisdictionInput!)`: Update an existing jurisdiction
- `DeleteJurisdiction(id: ID!)`: Delete a jurisdiction

## Example Queries

### Get a Specific Case

```graphql
query GetCase {
  GetCaseById(id: "1177184") {
    id
    name
    name_abbreviation
    decision_date
    court {
      name
      name_abbreviation
    }
    jurisdiction {
      name
      name_long
    }
    casebody {
      parties
      opinions {
        text
        type
        author
      }
    }
  }
}
```

### Search Cases

```graphql
query SearchCases {
  SearchCases(query: "Weidenfeller") {
    id
    name
    name_abbreviation
    decision_date
    court {
      name
    }
  }
}
```

### Get Cases by Date Range

```graphql
query GetCasesByDate {
  GetCasesByDateRange(startDate: "1990-01-01", endDate: "1995-12-31") {
    id
    name
    decision_date
    court {
      name
    }
  }
}
```

### Create a New Case

```graphql
mutation CreateCase {
  InsertCase(
    input: {
      name: "Sample Case Name"
      name_abbreviation: "Sample v. Case"
      decision_date: "2024-01-15"
      docket_number: "No. 12345"
      court_id: "8799"
      jurisdiction_id: "30"
      casebody: {
        parties: ["Plaintiff v. Defendant"]
        opinions: [
          {
            text: "This is the opinion text..."
            type: "majority"
            author: "Judge Smith"
          }
        ]
      }
    }
  ) {
    id
    name
    decision_date
  }
}
```

## Data Structure

The API handles complex nested data structures including:

- **Citations**: Official and unofficial citations
- **Analysis**: Metadata about the case including character count, OCR confidence, and page rank
- **Provenance**: Information about the source and batch of the case
- **Casebody**: The actual content including parties, opinions, and attorneys
- **Cites To**: References to other cases and legal materials

## Setup and Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database configuration
```

3. Start the server:

```bash
npm start
```

## Database Schema

The API expects the following database tables:

- `Case`: Main case data
- `Court`: Court information
- `Jurisdiction`: Jurisdiction information

Each table should have appropriate foreign key relationships and indexes for optimal query performance.

## Features

- **Full-text search** across case names, abbreviations, and docket numbers
- **Date range filtering** for temporal queries
- **Complex nested data** handling for legal citations and analysis
- **Relationship queries** between cases, courts, and jurisdictions
- **CRUD operations** for all major entities
- **Type-safe** GraphQL schema with TypeScript

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
