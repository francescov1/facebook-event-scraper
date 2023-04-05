import { findJsonInString } from '../json';

describe('findJsonInString', () => {
  const aDataString =
    '<script>{"name":{"text":"Alice"},"age":30}</script><script>{"name":{"text":"Bob"},"age":28}</script>';

  test('returns the value of the first occurence of the key when isDesiredValue is undefined', () => {
    const key = 'name';

    const result = findJsonInString(aDataString, key);

    expect(result.startIndex).toBe(16);
    expect(result.endIndex).toBe(31);
    expect(result.jsonData).toEqual({ text: 'Alice' });
  });

  test('returns the value of the first occurence of the key when isDesiredValue returns true', () => {
    const key = 'name';

    const result = findJsonInString(aDataString, key, () => true);

    expect(result.startIndex).toBe(16);
    expect(result.endIndex).toBe(31);
    expect(result.jsonData).toEqual({ text: 'Alice' });
  });

  test('returns the correct value when isDesiredValue returns true', () => {
    const key = 'name';

    const result = findJsonInString(
      aDataString,
      key,
      (candidate) => candidate.text === 'Bob'
    );

    expect(result.startIndex).toBe(67);
    expect(result.endIndex).toBe(80);
    expect(result.jsonData).toEqual({ text: 'Bob' });
  });

  test('returns null when the key is not found', () => {
    const key = 'email';

    const result = findJsonInString(aDataString, key);

    expect(result.startIndex).toBe(-1);
    expect(result.endIndex).toBe(-1);
    expect(result.jsonData).toBeNull();
  });

  test('returns null when isDesiredValue does not return true', () => {
    const key = 'name';

    const result = findJsonInString(aDataString, key, () => false);

    expect(result.startIndex).toBe(-1);
    expect(result.endIndex).toBe(-1);
    expect(result.jsonData).toBeNull();
  });

  test('handles nested json correctly', () => {
    const aNestedDataString =
      '<script>{"person":{"name":{"text":{"anotherLevel":"Alice"}}},"age":30}</script>';
    const key = 'person';

    const result = findJsonInString(aNestedDataString, key);

    expect(result.startIndex).toBe(18);
    expect(result.endIndex).toBe(59);
    expect(result.jsonData).toEqual({
      name: { text: { anotherLevel: 'Alice' } }
    });
  });

  test('handles arrays correctly', () => {
    const aNestedDataString =
      '<script>{"people":[{"name":{"text":"Alice"},"age":30},{"name":{"text":"Bob"},"age":28}]}</script>';
    const key = 'people';

    const result = findJsonInString(aNestedDataString, key);

    expect(result.startIndex).toBe(18);
    expect(result.endIndex).toBe(86);
    expect(result.jsonData).toEqual([
      {
        name: {
          text: 'Alice'
        },
        age: 30
      },
      {
        name: {
          text: 'Bob'
        },
        age: 28
      }
    ]);
  });

  test('handles special characters in values correctly', () => {
    const aNestedDataString =
      '<script>{"name":{"text":"} \\""},"age":30}</script>';
    const key = 'name';

    const result = findJsonInString(aNestedDataString, key);

    expect(result.startIndex).toBe(16);
    expect(result.endIndex).toBe(30);
    expect(result.jsonData).toEqual({ text: '} "' });
  });

  test('throws error when start character is invalid', () => {
    const anInvalidDataString = '<script>{"name":f}</script>';

    const key = 'name';

    expect(() => {
      findJsonInString(anInvalidDataString, key);
    }).toThrow('Invalid start character: f');
  });
});
