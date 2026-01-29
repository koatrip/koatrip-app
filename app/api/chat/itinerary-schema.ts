export const itinerarySchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/activity-steps.schema.json',
  type: 'object',
  required: [
    'destination',
    'dates',
    'budget',
    'steps'
  ],
  additionalProperties: false,
  properties: {
    destination: {
      type: 'string',
      minLength: 1,
      description: 'Name of the destination, if unique, or theme of the trip, if it encompasses visiting many different and disparate places'
    },
    dates: {
      type: 'object',
      required: [
        'start',
        'end'
      ],
      properties: {
        start: {
          type: 'string',
          format: 'date',
          description: 'Start date for the trip, either indicated by the user or inferred from the context'
        },
        end: {
          type: 'string',
          format: 'date',
          description: 'End date for the trip, either indicated by the user or inferred from the context'
        }
      }
    },
    budget: {
      type: 'integer',
      minimum: 1,
      description: 'Estimated ballpark of the investment required in order to cover the trip expenses for everybody involved and for all the activities'
    },
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: [
          'title',
          'type',
          'price_range',
          'description',
          'eta',
          'areas',
          'cities'
        ],
        additionalProperties: false,
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            description:
              'Brief designation of the activity, including the main neighbourhood / borough / district / department',
          },
          type: {
            type: 'string',
            enum: [
              'accommodation',
              'transit',
              'city-sightseeing',
              'culture',
              'food',
              'wellness',
              'nature',
              'sports',
              'shopping',
              'self-enrichment',
            ],
          },
          duration_minutes: {
            type: 'integer',
            minimum: 1,
            description: 'Duration of the activity in minutes. Optional if the `type` is `accommodation` or `transit`',
          },
          price_range: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description:
              'Relative price range, higher means more expensive (referenced to median Spanish salary)',
          },
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 1000,
            description: 'What the activity is about',
          },
          eta: {
            type: 'string',
            format: 'date-time',
            description: 'Expected time to start this activity',
          },
          areas: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'string',
              minLength: 1,
            },
            description:
              'Neighbourhood(s) / borough(s) / district(s) / department(s)',
          },
          cities: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'string',
              minLength: 1,
            },
            description: 'City or cities where the activity takes place',
          },
          must_see: {
            type: 'boolean',
            description: 'True if the activity is a must or highly recommended. Optional if the `type` is `accommodation` or `transit`',
          },
        },
      },
    },
  },
};
