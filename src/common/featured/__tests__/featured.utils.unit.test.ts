/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { contentOrAll } from "../featured.utils";


describe('Featured utils Unit tests', () => {
  it('"contentOrAll" should return content when given array is not empty', async () => {
    expect(contentOrAll(['foo', 'bar'])).toEqual(['foo', 'bar']);
  });

  it('"contentOrAll" should return ALL wildcard (*) when given array is empty', async () => {
    expect(contentOrAll([])).toEqual(['*']);
  });
});
