# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to our [GitHub Security Advisories](https://github.com/yourusername/lightweight-web-analytics/security/advisories/new). You will receive a response from us within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity.

## Security Measures

This project implements several security measures:

1. IP Address Anonymization
   - All IP addresses are hashed before storage
   - Salt is configurable via environment variables

2. No Personal Data Storage
   - No cookies used
   - No personal identifiable information (PII) stored
   - Compliant with GDPR requirements

3. Rate Limiting
   - Configurable rate limiting per IP address
   - Prevents abuse and DoS attacks

4. Authentication
   - Secure dashboard access
   - Environment variable based configuration
   - No default credentials
