@description('Name of the container app environment')
param containerAppEnvName string = 'habit-tracker-env'

@description('Name of the container app (backend)')
param containerAppName string = 'habit-tracker-backend'

@description('Location for all resources')
param location string = resourceGroup().location

@description('The container image to deploy')
param containerImage string = 'docker.io/library/habit-tracker-backend:latest'

@description('Minimum number of replicas')
param minReplicas int = 0

@description('Maximum number of replicas')
param maxReplicas int = 3

@description('Port exposed by the container')
param targetPort int = 5000

@description('MongoDB Atlas connection string')
@secure()
param mongoUri string

@description('JWT Secret')
@secure()
param jwtSecret string

@description('JWT Expiration')
param jwtExpire string = '7d'

@description('SendGrid API Key')
@secure()
param sendGridApiKey string = ''

@description('From email address')
param fromEmail string = 'noreply@habittracker.com'

@description('VAPID Public Key')
@secure()
param vapidPublicKey string = ''

@description('VAPID Private Key')
@secure()
param vapidPrivateKey string = ''

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${containerAppEnvName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container App Environment
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Container Registry (ACR)
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: 'habittracker${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// Container App (Backend only)
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
        corsPolicy: {
          allowedOrigins: [
            '*'
          ]
          allowedMethods: [
            'GET'
            'POST'
            'PUT'
            'DELETE'
            'OPTIONS'
          ]
          allowedHeaders: [
            '*'
          ]
          maxAge: 7200
        }
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.name
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
        {
          name: 'mongo-uri'
          value: mongoUri
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
        {
          name: 'sendgrid-api-key'
          value: sendGridApiKey
        }
        {
          name: 'vapid-public-key'
          value: vapidPublicKey
        }
        {
          name: 'vapid-private-key'
          value: vapidPrivateKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: containerImage
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: string(targetPort)
            }
            {
              name: 'MONGO_URI'
              secretRef: 'mongo-uri'
            }
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'JWT_EXPIRE'
              value: jwtExpire
            }
            {
              name: 'SENDGRID_API_KEY'
              secretRef: 'sendgrid-api-key'
            }
            {
              name: 'FROM_EMAIL'
              value: fromEmail
            }
            {
              name: 'CLIENT_URL'
              value: 'https://${containerAppName}.${containerAppEnvironment.properties.defaultDomain}'
            }
            {
              name: 'VAPID_PUBLIC_KEY'
              secretRef: 'vapid-public-key'
            }
            {
              name: 'VAPID_PRIVATE_KEY'
              secretRef: 'vapid-private-key'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: targetPort
              }
              initialDelaySeconds: 10
              periodSeconds: 30
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health'
                port: targetPort
              }
              initialDelaySeconds: 5
              periodSeconds: 10
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// Output the container app URL
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output registryLoginServer string = containerRegistry.properties.loginServer
output registryName string = containerRegistry.name

