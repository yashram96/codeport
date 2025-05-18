# CodePort - Modern Deployment Platform

CodePort is a modern, secure deployment management platform built with Nuxt 3 that helps teams streamline their deployment workflows.

## Features

- 🚀 **Multi-Host Deployments**: Deploy to multiple hosts simultaneously
- 📚 **Deployment Playbooks**: Create and manage reusable deployment scripts
- 📊 **Real-time Logging**: View deployment logs in real-time
- 🔐 **Role-based Access Control**: Admin and read-only user roles
- 📜 **Comprehensive History**: Track all deployments with detailed logs
- 🔄 **Automated Workflows**: Create standardized deployment processes

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Authentication**: Token-based with role management
- **State Management**: Vue 3 Composition API with Nuxt State
- **Build Tool**: Vite

## Project Structure

```
├── components/           # Vue components
│   ├── DeploymentForm   # Deployment creation form
│   ├── DeploymentHistory# Deployment history viewer
│   ├── LogViewer       # Real-time log viewer
│   └── ScriptEditor    # Playbook script editor
├── layouts/             # Page layouts
├── pages/              # Application routes
├── server/             # Server-side code
│   ├── api/           # API endpoints
│   └── utils/         # Server utilities
├── utils/             # Shared utilities
├── public/            # Static assets
└── playbooks/         # Deployment playbooks
```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Authentication**:
   Create `config/auth.json` with admin and read-only user credentials:
   ```json
   {
     "write": {
       "admin": {
         "username": "admin",
         "hashedPassword": "<bcrypt-hash>"
       }
     },
     "readonly": {
       "username": "user",
       "hashedPassword": "<bcrypt-hash>"
     }
   }
   ```

3. **Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

## Core Components

### DeploymentForm
- Creates new deployments
- Supports multiple host selection
- Configurable deployment arguments
- Playbook selection

### DeploymentHistory
- Lists all deployments
- Filterable by host
- Real-time status updates
- Log viewing

### LogViewer
- Real-time log streaming
- Syntax highlighting
- Error highlighting
- Searchable logs

### ScriptEditor
- Playbook management
- Syntax highlighting
- Variable validation
- Auto-save support

## Deployment Process

1. **Select Repository**: Choose the code repository to deploy
2. **Choose Hosts**: Select target deployment hosts
3. **Configure Arguments**: Set deployment-specific variables
4. **Select Playbook**: Choose the deployment script
5. **Execute**: Run the deployment process
6. **Monitor**: View real-time logs and status

## File Organization

### Logs
- Located in `/logs` directory
- One file per deployment
- Format: `{timestamp}.log`
- Contains metadata and execution logs

### Playbooks
- Located in `/playbooks` directory
- Shell scripts with metadata headers
- Support environment variables
- Reusable across deployments

### Settings
- Stored in `settings.json`
- Manages repositories, hosts, and scripts
- Configurable through UI
- Version controlled

## Security Features

- Token-based authentication
- Role-based access control
- Secure password hashing
- API route protection
- CSP headers

## Development Guidelines

1. **Component Creation**:
   - Use TypeScript
   - Follow Vue 3 Composition API
   - Include prop validations
   - Document component API

2. **API Endpoints**:
   - Validate all inputs
   - Include error handling
   - Use TypeScript types
   - Document response formats

3. **Playbook Development**:
   - Include metadata header
   - Document variables
   - Handle errors
   - Include success/failure logging

4. **Styling**:
   - Use Tailwind utility classes
   - Follow component class structure
   - Maintain consistent spacing
   - Use design system tokens

## Environment Variables

- `NUXT_PUBLIC_API_BASE`: API base URL
- `AUTH_SECRET`: Authentication secret
- `LOG_LEVEL`: Logging verbosity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Create pull request

## License

MIT License - see LICENSE file for details