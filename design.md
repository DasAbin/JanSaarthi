# JanSaarthi System Design

## Overview

JanSaarthi is a citizen services platform that democratizes access to government schemes and services through AI-powered voice interaction, document processing, and intelligent assistance. The system enables citizens to discover relevant government programs, understand eligibility criteria, and receive personalized guidance through natural language conversations and document analysis.

The platform combines multiple AI technologies:
- **Voice Interface**: Speech-to-text and text-to-speech for accessibility
- **Document Processing**: OCR and intelligent extraction from government documents
- **RAG Pipeline**: Retrieval-augmented generation for accurate, contextual responses
- **Multi-modal Interaction**: Support for voice, text, and document-based queries

## Architecture

### High-Level System Architecture

**Diagram**: The system follows a microservices architecture with the following components connected via API gateway:

```
[Client Apps] → [API Gateway] → [Auth Service]
                      ↓
    [App Server] ← → [Background Jobs]
         ↓
    [OCR Service] ← → [STT/TTS Pipeline] ← → [RAG Pipeline]
         ↓                                        ↓
    [Storage] ← → [Vector DB] ← → [LLM Service]
         ↓
    [Database] ← → [Admin/Analytics] ← → [Monitoring]
```

### Core Components

1. **Client Layer**
   - Web application (React/Vue.js)
   - Mobile application (React Native/Flutter)
   - Voice-first UI with upload capabilities

2. **API Gateway**
   - Request routing and load balancing
   - Rate limiting and authentication
   - Request/response transformation

3. **Authentication Service**
   - JWT-based authentication
   - OAuth integration for government ID systems
   - Role-based access control

4. **Application Server**
   - Node.js with Fastify or Python with Flask
   - Business logic orchestration
   - API endpoint implementation

5. **OCR Service**
   - Containerized worker using PaddleOCR/Tesseract
   - Document preprocessing and text extraction
   - Multi-language support

6. **STT/TTS Pipeline**
   - Speech-to-text using Vosk/Whisper
   - Text-to-speech engine for responses
   - Real-time streaming capabilities

7. **RAG Pipeline**
   - Vector database (Milvus/Weaviate/Pinecone)
   - Embeddings service
   - LLM service for generation

8. **Storage & Database**
   - S3-compatible storage for documents
   - PostgreSQL for structured data
   - Redis for caching and sessions

9. **Background Jobs**
   - Celery with Redis broker
   - Document processing workflows
   - Batch embedding generation

10. **Monitoring & Analytics**
    - Prometheus for metrics collection
    - Grafana for visualization
    - Admin dashboard for system management

### Data Flow Descriptions

**Document Upload Flow**: `upload → preprocess → ocr → extract → chunk → embed → store`

1. User uploads document via client
2. Document stored in S3-compatible storage
3. OCR service preprocesses and extracts text
4. Text chunked into semantic segments
5. Embeddings generated for each chunk
6. Vectors stored in vector database
7. Metadata stored in PostgreSQL

**Question-Answer Flow**: `question → embed → retrieve → rank → generate → respond`

1. User submits question (voice or text)
2. STT converts voice to text if needed
3. Question embedded using same model
4. Vector similarity search retrieves relevant chunks
5. Retrieved content re-ranked for relevance
6. LLM generates response with citations
7. TTS converts response to speech if needed

## Components and Interfaces

### API Gateway
**Responsibility**: Request routing, authentication, rate limiting, and load balancing

**Inputs**: HTTP requests from clients
**Outputs**: Routed requests to backend services

**JSON Schema**:
```json
{
  "request": {
    "method": "POST",
    "path": "/api/v1/ask",
    "headers": {
      "Authorization": "Bearer <jwt_token>",
      "Content-Type": "application/json"
    },
    "body": {
      "question": "string",
      "context": "object"
    }
  }
}
```

**Throughput**: 1000 requests/second
**Scaling**: Horizontal scaling with load balancer
**Failure Modes**: Circuit breaker pattern, graceful degradation

### Authentication Service
**Responsibility**: User authentication, authorization, and session management

**Inputs**: Login credentials, JWT tokens
**Outputs**: Authentication tokens, user profiles

**JSON Schema**:
```json
{
  "login_request": {
    "username": "string",
    "password": "string",
    "provider": "local|oauth"
  },
  "auth_response": {
    "token": "string",
    "expires_in": "number",
    "user": {
      "id": "string",
      "name": "string",
      "roles": ["string"]
    }
  }
}
```

**Throughput**: 500 authentications/second
**Scaling**: Stateless design with Redis for session storage
**Failure Modes**: Token refresh, fallback authentication

### Application Server
**Responsibility**: Business logic orchestration, API endpoint implementation

**Inputs**: Authenticated API requests
**Outputs**: Processed responses, background job triggers

**Throughput**: 2000 requests/second
**Scaling**: Horizontal scaling with container orchestration
**Failure Modes**: Graceful error handling, request queuing

### OCR Service
**Responsibility**: Document preprocessing, text extraction, language detection

**Inputs**: Document files (PDF, images)
**Outputs**: Extracted text with confidence scores

**JSON Schema**:
```json
{
  "ocr_request": {
    "document_id": "string",
    "file_url": "string",
    "language_hint": "string"
  },
  "ocr_response": {
    "text": "string",
    "confidence": "number",
    "language": "string",
    "pages": ["string"]
  }
}
```

**Throughput**: 100 documents/minute
**Scaling**: Horizontal worker scaling
**Failure Modes**: Fallback OCR engines, manual review queue

### STT/TTS Pipeline
**Responsibility**: Speech processing, voice synthesis

**Inputs**: Audio streams, text for synthesis
**Outputs**: Transcribed text, synthesized audio

**JSON Schema**:
```json
{
  "stt_request": {
    "audio_url": "string",
    "language": "string",
    "format": "wav|mp3"
  },
  "tts_request": {
    "text": "string",
    "language": "string",
    "voice": "string"
  }
}
```

**Throughput**: 50 concurrent streams
**Scaling**: GPU-accelerated workers
**Failure Modes**: Text-only fallback, quality degradation

### RAG Pipeline
**Responsibility**: Vector search, content retrieval, response generation

**Inputs**: User queries, document chunks
**Outputs**: Generated responses with citations

**JSON Schema**:
```json
{
  "rag_request": {
    "query": "string",
    "context": "object",
    "max_results": "number"
  },
  "rag_response": {
    "answer": "string",
    "sources": [{
      "document_id": "string",
      "chunk_id": "string",
      "relevance_score": "number",
      "text": "string"
    }],
    "confidence": "number"
  }
}
```

**Throughput**: 200 queries/second
**Scaling**: Vector DB sharding, LLM API scaling
**Failure Modes**: Cached responses, simplified retrieval
## RAG Details

### Chunking Strategy
- **Chunk Size**: 512 tokens with 50-token overlap
- **Semantic Chunking**: Preserve sentence boundaries
- **Hierarchical Chunking**: Document → Section → Paragraph → Sentence
- **Metadata Preservation**: Document source, section headers, page numbers

### Embeddings Model
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Dimensionality**: 384 dimensions
- **Languages**: English, Hindi, and regional languages
- **Fine-tuning**: Domain-specific fine-tuning on government documents

### Vector Database Selection
- **Primary Choice**: Milvus for production scale
- **Rationale**: High performance, horizontal scaling, rich query capabilities
- **Target QPS**: 1000 queries per second
- **Index Type**: HNSW for balanced performance and accuracy

### Retrieval and Re-ranking
- **Initial Retrieval**: Top-50 candidates via vector similarity
- **Re-ranking**: Cross-encoder model for semantic relevance
- **Final Selection**: Top-10 most relevant chunks
- **Citation Generation**: Source document tracking with confidence scores

**Re-ranking Model**: `cross-encoder/ms-marco-MiniLM-L-6-v2`

## OCR & Document Processing

### Preprocessing Pipeline
1. **Image Enhancement**
   - Deskewing using Hough transform
   - Noise reduction with Gaussian blur
   - Contrast enhancement via histogram equalization
   - Resolution upscaling for low-quality images

2. **Document Analysis**
   - Layout detection for multi-column documents
   - Table extraction and structure preservation
   - Header/footer identification and removal

### OCR Engine Strategy
- **Primary Engine**: PaddleOCR for multilingual support
- **Fallback Engine**: Tesseract for English documents
- **Confidence Threshold**: 0.7 for automatic processing
- **Manual Review**: Documents below confidence threshold

### Language Detection and Multilingual OCR
- **Language Detection**: `langdetect` library with confidence scoring
- **Supported Languages**: English, Hindi, Bengali, Tamil, Telugu, Gujarati, Marathi
- **Script Detection**: Devanagari, Latin, regional scripts
- **Mixed Language Handling**: Per-region language detection

**Language Models**:
- Hindi: `hin.traineddata`
- English: `eng.traineddata`
- Regional: Language-specific trained models

## STT/TTS Design

### Speech-to-Text Configuration
- **Primary Engine**: Whisper (OpenAI) for accuracy
- **Fallback Engine**: Vosk for offline capability
- **Supported Languages**: English, Hindi, and 10 regional languages
- **Latency Target**: <2 seconds for 30-second audio clips

### Text-to-Speech Configuration
- **Engine**: Festival TTS with Indian voice models
- **Voice Options**: Male/female voices per language
- **Quality**: 16kHz sampling rate, natural prosody
- **Latency Target**: <1 second for 100-word responses

### Streaming vs Batch Trade-offs
- **Streaming**: Real-time conversation, higher resource usage
- **Batch**: Better accuracy, higher latency
- **Hybrid Approach**: Streaming for short queries, batch for long documents

### Low-Bandwidth Fallback
- **Detection**: Network speed monitoring
- **Fallback**: Text-only interface with simplified UI
- **Progressive Enhancement**: Audio features enabled when bandwidth improves
## Frontend & UX

### Page Structure and Flows

#### 1. Home Page
**Layout**: Hero section with voice activation button, quick access cards for common services
**Key Interactions**: 
- Voice activation with visual feedback
- Service category browsing
- Recent queries display
- Language selection dropdown

#### 2. Upload & OCR Page
**Layout**: Drag-and-drop upload area, processing status, extracted text preview
**Key Interactions**:
- File selection (camera, gallery, file browser)
- Upload progress with cancellation
- OCR results with confidence indicators
- Text correction interface

#### 3. Ask (Chat) Page
**Layout**: Chat interface with voice input button, message history, typing indicators
**Key Interactions**:
- Voice-to-text input with real-time transcription
- Text input with auto-suggestions
- Response playback controls
- Source citation links

#### 4. Form Helper Page
**Layout**: Step-by-step form wizard, field explanations, document requirements
**Key Interactions**:
- Voice-guided form filling
- Field validation with helpful errors
- Document upload integration
- Progress saving and resumption

#### 5. Learn Page
**Layout**: Scheme categories, search filters, detailed scheme cards
**Key Interactions**:
- Category-based browsing
- Search with filters (location, income, age)
- Scheme comparison tool
- Eligibility checker

#### 6. Admin Dashboard
**Layout**: System metrics, user analytics, content management, system health
**Key Interactions**:
- Real-time monitoring charts
- User query analysis
- Content approval workflow
- System configuration

### Accessibility Features
- **Voice Prompts**: Audio instructions for each interface element
- **Large Fonts**: Scalable text with high contrast themes
- **Screen Reader**: ARIA labels and semantic HTML structure
- **Keyboard Navigation**: Full keyboard accessibility with focus indicators
- **Voice Commands**: "Navigate to upload", "Read this aloud", "Go back"
- **Multi-language Support**: Interface translation for regional languages

## Data Model

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'en',
    location JSONB,
    demographics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    filename VARCHAR(255),
    file_url TEXT,
    file_type VARCHAR(50),
    ocr_text TEXT,
    ocr_confidence DECIMAL(3,2),
    language VARCHAR(10),
    status VARCHAR(20) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Schemes Table
```sql
CREATE TABLE schemes (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(255),
    eligibility_criteria JSONB,
    benefits JSONB,
    application_process JSONB,
    documents_required JSONB,
    contact_info JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Vector Embeddings Table
```sql
CREATE TABLE embeddings (
    id UUID PRIMARY KEY,
    document_id UUID REFERENCES documents(id),
    chunk_text TEXT,
    embedding VECTOR(384),
    chunk_index INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```
### Sample Scheme Record
```json
{
  "id": "scheme-001",
  "name": "Pradhan Mantri Awas Yojana",
  "description": "Housing scheme for economically weaker sections",
  "department": "Ministry of Housing and Urban Affairs",
  "eligibility_criteria": {
    "income": {
      "max_annual": 600000,
      "currency": "INR"
    },
    "age": {
      "min": 18,
      "max": 70
    },
    "family_composition": {
      "max_members": 6
    },
    "location": {
      "type": "urban",
      "excluded_areas": ["metro_core"]
    },
    "existing_property": false
  },
  "benefits": {
    "subsidy_amount": 267000,
    "loan_tenure": 20,
    "interest_rate": 6.5
  },
  "application_process": {
    "steps": [
      "Online registration",
      "Document verification",
      "Bank loan application",
      "Property selection",
      "Final approval"
    ],
    "timeline": "45-60 days"
  },
  "documents_required": [
    "Aadhaar card",
    "Income certificate",
    "Bank statements",
    "Property documents"
  ],
  "contact_info": {
    "helpline": "1800-11-6163",
    "website": "https://pmaymis.gov.in",
    "email": "pmay@gov.in"
  }
}
```

## API Contract Examples

### Upload Document API
```http
POST /api/v1/upload
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

{
  "file": "<binary_data>",
  "language_hint": "hi",
  "document_type": "income_certificate"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "document_id": "doc-12345",
    "filename": "income_cert.pdf",
    "status": "processing",
    "estimated_completion": "2024-01-15T10:30:00Z"
  }
}
```

### Ask Question API
```http
POST /api/v1/ask
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "question": "What housing schemes am I eligible for?",
  "context": {
    "user_profile": {
      "income": 400000,
      "location": "Delhi",
      "family_size": 4
    },
    "conversation_id": "conv-789"
  },
  "response_format": "text_and_audio"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "answer": "Based on your profile, you are eligible for Pradhan Mantri Awas Yojana...",
    "audio_url": "https://storage.example.com/audio/response-123.mp3",
    "sources": [
      {
        "scheme_id": "scheme-001",
        "relevance_score": 0.95,
        "excerpt": "Income limit for PMAY is ₹6 lakhs per annum..."
      }
    ],
    "confidence": 0.92,
    "conversation_id": "conv-789"
  }
}
```

### Get Schemes API
```http
GET /api/v1/schemes?category=housing&location=Delhi&income_max=500000
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "schemes": [
      {
        "id": "scheme-001",
        "name": "Pradhan Mantri Awas Yojana",
        "description": "Housing scheme for economically weaker sections",
        "eligibility_match": 0.85,
        "estimated_benefit": 267000
      }
    ],
    "total_count": 1,
    "filters_applied": {
      "category": "housing",
      "location": "Delhi",
      "income_max": 500000
    }
  }
}
```
## Security, Privacy & Compliance

### Encryption
- **Data in Transit**: TLS 1.3 for all API communications
- **Data at Rest**: AES-256 encryption for database and file storage
- **Key Management**: AWS KMS or HashiCorp Vault for key rotation

### Access Control
- **Authentication**: JWT tokens with 24-hour expiry
- **Authorization**: Role-based access control (RBAC)
- **Principle of Least Privilege**: Minimal permissions per service
- **API Keys**: Service-to-service authentication with rotation

### PII Minimization
- **Data Collection**: Only essential information collected
- **Data Retention**: 7-year retention policy with automatic deletion
- **Anonymization**: Personal identifiers removed from analytics
- **Consent Management**: Explicit consent for data processing

### Audit Logging
- **Access Logs**: All API requests with user identification
- **Data Changes**: Complete audit trail for sensitive operations
- **Security Events**: Failed authentication attempts, privilege escalations
- **Compliance Reports**: Automated generation for regulatory requirements

### Rate Limiting & Abuse Prevention
- **API Rate Limits**: 100 requests/minute per user, 1000/minute per IP
- **Upload Limits**: 10MB per file, 100MB per day per user
- **Query Limits**: 50 questions per hour per user
- **DDoS Protection**: CloudFlare or AWS Shield integration

### Consent Flow
1. **Registration**: Clear privacy policy acceptance
2. **Data Processing**: Granular consent for different data types
3. **Third-party Sharing**: Explicit consent for government data sharing
4. **Withdrawal**: Easy consent withdrawal with data deletion

## Monitoring & Observability

### Key Metrics
- **System Performance**
  - API response time (p95 < 500ms)
  - Error rate (< 1%)
  - Throughput (requests/second)
  - Resource utilization (CPU, memory, disk)

- **AI/ML Performance**
  - OCR confidence scores (average > 0.8)
  - Vector retrieval time (< 100ms)
  - LLM response time (< 3 seconds)
  - STT/TTS latency (< 2 seconds)

- **Business Metrics**
  - User engagement (sessions/day)
  - Query success rate (> 90%)
  - Document processing success rate (> 95%)
  - User satisfaction scores

### Alerting Thresholds
- **Critical**: API error rate > 5%, system downtime
- **Warning**: Response time > 1 second, OCR confidence < 0.7
- **Info**: High traffic patterns, resource scaling events

### Monitoring Stack
- **Metrics Collection**: Prometheus with custom exporters
- **Visualization**: Grafana dashboards with real-time updates
- **Log Aggregation**: ELK stack (Elasticsearch, Logstash, Kibana)
- **Distributed Tracing**: Jaeger for request flow analysis
- **Uptime Monitoring**: External monitoring with PagerDuty integration
## Deployment Plan

### Local Development Setup
```bash
# Prerequisites
docker --version
docker-compose --version
node --version  # v18+
python --version  # 3.9+

# Clone and setup
git clone https://github.com/org/jansaarthi
cd jansaarthi
cp .env.example .env

# Start services
docker-compose up -d postgres redis milvus
npm install && npm run dev

# Initialize data
npm run db:migrate
npm run seed:schemes
```

### Staging Environment
- **Infrastructure**: Docker containers on AWS ECS
- **Database**: RDS PostgreSQL with read replicas
- **Storage**: S3 with CloudFront CDN
- **Monitoring**: CloudWatch with custom metrics
- **CI/CD**: GitHub Actions with automated testing

### Production Environment
- **Container Orchestration**: Kubernetes on AWS EKS
- **Load Balancing**: Application Load Balancer with SSL termination
- **Auto Scaling**: Horizontal Pod Autoscaler based on CPU/memory
- **Database**: Multi-AZ RDS with automated backups
- **Caching**: ElastiCache Redis cluster
- **CDN**: CloudFront for static assets and API caching

### Recommended Cloud Providers
1. **AWS**: Complete ecosystem, mature AI/ML services
2. **Google Cloud**: Strong AI/ML capabilities, competitive pricing
3. **Azure**: Good integration with Microsoft ecosystem

### Scaling Recipe for RAG Components

#### Vector Database Scaling
```yaml
# Milvus cluster configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: milvus-cluster
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: milvus
        image: milvusdb/milvus:v2.3.0
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
```

#### LLM Service Scaling
- **GPU Instances**: NVIDIA T4 or V100 for inference
- **Model Serving**: TensorRT optimization for faster inference
- **Load Balancing**: Round-robin across multiple model instances
- **Caching**: Response caching for common queries

## Testing & Evaluation

### Unit Testing
- **Coverage Target**: 90% code coverage
- **Framework**: Jest for Node.js, pytest for Python
- **Mocking**: External service mocks for isolated testing
- **CI Integration**: Automated testing on every commit

### Integration Testing
- **API Testing**: Postman collections with automated runs
- **Database Testing**: Test data fixtures and cleanup
- **Service Integration**: Docker Compose test environments
- **End-to-End**: Cypress for web UI, Detox for mobile

### Synthetic Test Data
```json
{
  "test_documents": [
    {
      "type": "income_certificate",
      "language": "hindi",
      "quality": "high",
      "expected_confidence": 0.9
    },
    {
      "type": "aadhaar_card",
      "language": "english",
      "quality": "low",
      "expected_confidence": 0.7
    }
  ],
  "test_queries": [
    {
      "question": "What is the income limit for PMAY?",
      "expected_schemes": ["scheme-001"],
      "confidence_threshold": 0.8
    }
  ]
}
```
### Evaluation Metrics

#### RAG Accuracy
- **Retrieval Precision**: Relevant documents in top-k results
- **Answer Relevance**: Human evaluation of generated responses
- **Citation Accuracy**: Correct source attribution
- **Factual Consistency**: Alignment with source documents

#### OCR Performance
- **Word Error Rate (WER)**: < 5% for high-quality documents
- **Character Error Rate (CER)**: < 2% for printed text
- **Language Detection Accuracy**: > 95% for supported languages

#### STT Performance
- **Word Error Rate**: < 10% for clear audio
- **Real-time Factor**: < 0.5 (faster than real-time)
- **Language Identification**: > 90% accuracy

### Performance Benchmarks
- **Load Testing**: Apache JMeter with 1000 concurrent users
- **Stress Testing**: Gradual load increase to failure point
- **Volume Testing**: Large document processing capabilities
- **Endurance Testing**: 24-hour continuous operation

## Trade-offs & Open Design Decisions

### Current Trade-offs
1. **Accuracy vs Latency**: Higher accuracy models increase response time
2. **Cost vs Performance**: GPU instances for better AI performance at higher cost
3. **Storage vs Processing**: Pre-computed embeddings vs on-demand generation
4. **Security vs Usability**: Strong authentication vs ease of access

### Open Design Decisions
1. **Multi-tenancy**: Single-tenant vs multi-tenant architecture
2. **Caching Strategy**: Redis vs in-memory vs database caching
3. **Model Hosting**: Self-hosted vs API-based LLM services
4. **Data Residency**: Cloud vs on-premises for sensitive data

### Future Considerations
- **Federated Learning**: Privacy-preserving model updates
- **Edge Computing**: Local processing for sensitive documents
- **Blockchain**: Immutable audit trails for government interactions

## Future Roadmap & Extension Ideas

### Phase 2: Enhanced Features
- **Progressive Disclosure**: Adaptive UI based on user expertise
- **Offline Packaging**: Downloadable scheme databases for offline use
- **SMS Gateway**: Text-based interaction for feature phones
- **WhatsApp Integration**: Chatbot interface via WhatsApp Business API

### Phase 3: Advanced Capabilities
- **Predictive Analytics**: Proactive scheme recommendations
- **Document Generation**: Auto-filled application forms
- **Video Processing**: OCR from video documents
- **Multilingual Expansion**: Support for 22 official Indian languages

### Phase 4: Ecosystem Integration
- **Government API Integration**: Direct application submission
- **Banking Integration**: Loan application assistance
- **Digital Identity**: Integration with DigiLocker and Aadhaar
- **IoT Integration**: Voice assistants and smart speakers

### Long-term Vision
- **AI-Powered Governance**: Intelligent policy recommendation system
- **Citizen Feedback Loop**: Continuous improvement based on user interactions
- **Cross-border Services**: Extension to other developing countries
- **Open Source Community**: Public-private partnership model

## Developer Setup & Mock Data

### How to Run Locally

#### Prerequisites Checklist
- [ ] Docker and Docker Compose installed
- [ ] Node.js 18+ and npm installed
- [ ] Python 3.9+ and pip installed
- [ ] Git configured with SSH keys
- [ ] 16GB RAM and 50GB free disk space

#### Quick Start Commands
```bash
# 1. Clone repository
git clone git@github.com:org/jansaarthi.git
cd jansaarthi

# 2. Environment setup
cp .env.example .env
# Edit .env with your configuration

# 3. Start infrastructure services
docker-compose up -d postgres redis milvus s3-local

# 4. Install dependencies
npm install
pip install -r requirements.txt

# 5. Database setup
npm run db:create
npm run db:migrate
npm run db:seed

# 6. Start development servers
npm run dev:api &
npm run dev:web &
python -m uvicorn ocr_service:app --reload --port 8001 &

# 7. Verify setup
curl http://localhost:3000/health
curl http://localhost:8000/api/v1/health
```

#### Mock Data Locations
- **Scheme Database**: `./data/mock/schemes.json` - 100+ government schemes
- **Test Documents**: `./data/mock/documents/` - Sample PDFs and images
- **User Profiles**: `./data/mock/users.json` - Test user accounts
- **Audio Samples**: `./data/mock/audio/` - STT/TTS test files
- **API Responses**: `./data/mock/api/` - Cached API responses for development

#### Development Tools
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Database Admin**: http://localhost:8080 (pgAdmin)
- **Vector DB UI**: http://localhost:19121 (Milvus Attu)
- **Monitoring**: http://localhost:3001 (Grafana)

#### Testing Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Load test data
npm run load:test-data

# Reset development environment
npm run dev:reset
```

This comprehensive design provides the foundation for implementing a robust, scalable, and user-friendly citizen services platform that can effectively serve India's diverse population while maintaining high standards of security, privacy, and performance.