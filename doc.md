# API Usage Guide

This document outlines the endpoints available in our Node.js backend and how to use them.

## Base URL

The base URL for all endpoints is:

```
http://[your-server-address]:[port]
```

Replace `[your-server-address]` with your server's address and `[port]` with the port number your server is running on (default is 5432).

## Endpoints

### 1. Health Check

- **URL:** `/`
- **Method:** GET
- **Description:** Check if the server is running.
- **Response:** 
  ```json
  {
    "status": 200
  }
  ```

### 2. Translate Text

- **URL:** `/translate`
- **Method:** POST
- **Headers:**
  - `ocp-apim-subscription-region`: (Required) The HSK level (1-6) as a string
  - `ocp-apim-subscription-key`: (Required) Your API key
- **Query Parameters:**
  - `to`: (Required) Target language code
  - `from`: (Optional) Source language code (defaults to 'en' if not provided)
  - `api-version`: (Required) API version string
- **Body:**
  ```json
  [
    {
      "text": "Your text to translate"
    }
  ]
  ```
- **Description:** Translates and simplifies the given text based on the specified HSK level.
- **Response:**
  ```json
  [
    {
      "detectedLanguage": {
        "language": "en",
        "score": 1
      },
      "translations": [
        {
          "text": "Translated and simplified text",
          "to": "zh-CN"
        }
      ]
    }
  ]
  ```

### 3. Process Custom Dictionary

- **URL:** `/process_file`
- **Method:** POST
- **Body:**
  ```json
  {
    "content": "word1\nword2\nword3"
  }
  ```
- **Description:** Uploads a custom dictionary to be used in translations. Each word should be on a new line.
- **Response:**
  ```json
  {
    "message": "File content received and stored in user_custom_dict"
  }
  ```

## Usage Examples

### Health Check

```bash
curl http://localhost:5432/
```

### Translate Text

```bash
curl -X POST \
  'http://localhost:5432/translate?to=zh-CN&api-version=3.0' \
  -H 'Content-Type: application/json' \
  -H 'ocp-apim-subscription-region: 3' \
  -H 'ocp-apim-subscription-key: your-api-key' \
  -d '[
    {
      "text": "Hello, how are you today?"
    }
  ]'
```

### Process Custom Dictionary

```bash
curl -X POST \
  http://localhost:5432/process_file \
  -H 'Content-Type: application/json' \
  -d '{
    "content": "apple\nbanana\ncherry"
  }'
```

## Notes

- The HSK level is specified in the `ocp-apim-subscription-region` header when making a translation request. This determines the complexity of the Chinese output.
- The custom dictionary uploaded via the `/process_file` endpoint will be used in subsequent translation requests to include user-specific vocabulary.
- Make sure to replace `your-api-key` with your actual API key when making requests.