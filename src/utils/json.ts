// TODO: make this into its own library. Couple things to add before releasing to public
// - Add a new method for getting keys with direct values (essentially use " as the start and end character)
// - Handle json with whitespaces
// - Use a separate func for arrays (eg findJsonArrayInString)

// TODO: Use better typing, eg:
// interface ReturnData {
//   startIndex: number;
//   endIndex: number;
//   jsonData: Record<string, any> | Record<string, any>[] | null;
// }

export const findJsonInString = (
  dataString: string,
  key: string,
  isDesiredValue?: (value: Record<string, any>) => boolean
): any => {
  const prefix = `"${key}":`;

  let startPosition = 0;

  // This loop is used for iterating over found json objects, and checking if they are the one we want using the isDesiredValue callback
  while (true) {
    let idx = dataString.indexOf(prefix, startPosition);
    if (idx === -1) {
      return { startIndex: -1, endIndex: -1, jsonData: null };
    }

    idx += prefix.length;
    const startIndex = idx;

    const startCharacter = dataString[startIndex];

    // Value is null
    if (
      startCharacter === 'n' &&
      dataString.slice(startIndex, startIndex + 4) === 'null'
    ) {
      return { startIndex, endIndex: startIndex + 3, jsonData: null };
    }

    // Unexpected start character
    if (startCharacter !== '{' && startCharacter !== '[') {
      throw new Error(`Invalid start character: ${startCharacter}`);
    }

    const endCharacter = startCharacter === '{' ? '}' : ']';

    let nestedLevel = 0;
    // This is set to true anytime idx is pointing to a string value. In these cases, we want to ignore any start or end characters we find
    let isIndexInString = false;

    // This loop iterates over each character in the json object until we get to the end of the object
    while (idx < dataString.length - 1) {
      // In the first iteration, idx is pointing to the first "{" or "[", so we start by incrementing it
      idx++;

      // Note that '\\' actually refers to a single quote, but we need to escape the backslash since Node will otherwise interpret it as an escape character
      if (dataString[idx] === '"' && dataString[idx - 1] !== '\\') {
        isIndexInString = !isIndexInString;
      } else if (dataString[idx] === endCharacter && !isIndexInString) {
        if (nestedLevel === 0) {
          break;
        }
        nestedLevel--;
      } else if (dataString[idx] === startCharacter && !isIndexInString) {
        nestedLevel++;
      }
    }

    const jsonDataString = dataString.slice(startIndex, idx + 1);

    // TODO: See how useful error message is from this. If not good enough, add handling & rethrowing
    const jsonData = JSON.parse(jsonDataString);

    if (!isDesiredValue || isDesiredValue(jsonData)) {
      return { startIndex, endIndex: idx, jsonData };
    }

    startPosition = idx;
  }
};
