/**
 * Structured Logger for Temporal Workers
 *
 * All logs include:
 * - tenant_id: For filtering by tenant
 * - workflow_id: For tracing specific executions
 * - timestamp: ISO format
 * - level: info, warn, error
 *
 * Output format: JSON for easy parsing by log aggregators
 */

export interface LogContext {
  tenantId: string;
  workflowId?: string;
  workflowType?: string;
  leadId?: string;
  activityName?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tenant_id: string;
  workflow_id?: string;
  workflow_type?: string;
  lead_id?: string;
  activity?: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

class WorkflowLogger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      tenant_id: this.context.tenantId,
      workflow_id: this.context.workflowId,
      workflow_type: this.context.workflowType,
      lead_id: this.context.leadId,
      activity: this.context.activityName,
      message,
      data,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    // Output as JSON for structured logging
    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        if (process.env.LOG_LEVEL === 'debug') {
          console.log(output);
        }
        break;
      default:
        console.log(output);
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', message, data, error);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): WorkflowLogger {
    return new WorkflowLogger({
      ...this.context,
      ...additionalContext,
    });
  }
}

/**
 * Create a logger for a workflow
 */
export function createWorkflowLogger(
  tenantId: string,
  workflowId: string,
  workflowType: string,
  leadId?: string
): WorkflowLogger {
  return new WorkflowLogger({
    tenantId,
    workflowId,
    workflowType,
    leadId,
  });
}

/**
 * Create a logger for an activity
 */
export function createActivityLogger(
  tenantId: string,
  activityName: string,
  leadId?: string
): WorkflowLogger {
  return new WorkflowLogger({
    tenantId,
    activityName,
    leadId,
  });
}

/**
 * Simple log function for quick logging with tenant context
 * Use when you don't need a full logger instance
 */
export function logWithTenant(
  level: LogLevel,
  tenantId: string,
  message: string,
  data?: Record<string, unknown>
): void {
  const logger = new WorkflowLogger({ tenantId });
  switch (level) {
    case 'info':
      logger.info(message, data);
      break;
    case 'warn':
      logger.warn(message, data);
      break;
    case 'error':
      logger.error(message, undefined, data);
      break;
    case 'debug':
      logger.debug(message, data);
      break;
  }
}

export { WorkflowLogger };
