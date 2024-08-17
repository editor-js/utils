import { test, describe, expect } from 'vitest';
import { deepMerge } from './deepMerge';

describe('Test deep merge function', () => {
  test.each(
    [
      {
        sources: [
          {
            firstValue: 1,
          },
          {
            secondValue: 2,
          },
          {
            thirdValue: 3,
          },
        ],
        merged: {
          firstValue: 1,
          secondValue: 2,
          thirdValue: 3,
        },
      },
      {
        sources: [
          {
            firstObject: {
              firstValue: 1,
            },
            secondObject: {
              secondValue: 2,
            },
          },
          {
            thirdValue: 1,
          },
          {
            deepObject: {
              deeperObject: {
                value: 0,
              },
            },
          },
        ],
        merged: {
          firstObject: {
            firstValue: 1,
          },
          secondObject: {
            secondValue: 2,
          },
          thirdValue: 1,
          deepObject: {
            deeperObject: {
              value: 0,
            },
          },
        },
      },
      {
        sources: [
          {
            firstValue: 1,
          },
          {
            firstValue: 1,
          },
          {
            firstValue: 1,
          },
        ],
        merged: {
          firstValue: 1,
        },
      },
    ])('Should merge object with array of objects', ({ sources, merged }) => {
    expect(deepMerge({}, ...sources)).toStrictEqual(merged);
  });
});
