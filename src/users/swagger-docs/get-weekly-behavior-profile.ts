import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const GetWeeklyBehaviorProfileDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get weekly behavior digest',
      description:
        'Returns unseen weekly behavior result if present. If none exists, creates digest for latest completed week when available.',
    }),
    ApiOkResponse({
      description: 'Weekly behavior digest state.',
      content: {
        'application/json': {
          examples: {
            weeklyDigest: {
              summary: 'Weekly result available',
              value: {
                id: 12,
                weekStart: '2026-04-13T00:00:00.000Z',
                weekEnd: '2026-04-19T23:59:59.999Z',
                seenAt: null,
                actualBalance: {
                  work: 60,
                  life: 20,
                  learning: 20,
                },
                targetBalance: {
                  work: 50,
                  life: 25,
                  learning: 25,
                },
                metrics: {
                  completionRate: 0.72,
                  failureRate: 0.08,
                  consistency: 0.86,
                  pointsSignal: 0.8,
                  verificationSignal: 1,
                },
                replicantScore: 0.74,
                type: 'replicant',
                createdAt: '2026-04-20T00:01:00.000Z',
              },
            },
            noDigestYet: {
              summary: 'Weekly result is not available yet',
              value: {
                message: 'No weekly result yet',
              },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
      content: {
        'application/json': {
          example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized',
          },
        },
      },
    }),
  );
