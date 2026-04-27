import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const GetBehaviorProfileDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get instant behavior profile',
      description:
        'Returns current behavior profile, score and predicted type for the authenticated user.',
    }),
    ApiOkResponse({
      description: 'Behavior profile generated successfully.',
      content: {
        'application/json': {
          example: {
            computedAt: '2026-04-21T12:00:00.000Z',
            range: {
              from: '2026-04-20T00:00:00.000Z',
              to: '2026-04-26T23:59:59.999Z',
            },
            actualBalance: {
              work: 55.56,
              life: 33.33,
              learning: 11.11,
            },
            targetBalance: {
              work: 50,
              life: 25,
              learning: 25,
            },
            metrics: {
              caseCount: 18,
              completedCount: 9,
              failedCount: 2,
              activeDays: 5,
              totalDays: 7,
              completionRate: 0.5,
              failureRate: 0.11,
              consistency: 0.71,
              targetMatch: 0.88,
              pointsSignal: 0.64,
              verificationSignal: 1,
            },
            replicantScore: 0.67,
            type: 'undefined',
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
