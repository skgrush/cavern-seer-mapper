import {Color, Vector3} from "three";

export type PrimitiveWallsMaterial = {
  readonly emissiveColor: Color;
  readonly diffuseColor: Color;
};
export type PrimitiveWallsFile = {
  readonly lines: Vector3[][];
  readonly material: PrimitiveWallsMaterial;
};

export function primitiveWallsFileParse(vrmlString: string): PrimitiveWallsFile {
  let remainingVrml = vrmlString;

  const expectedMagic = '#VRML V1.0 ascii';
  if (!remainingVrml.startsWith(expectedMagic)) {
    throw new Error(`unexpected WRL header: ${remainingVrml.slice(0, expectedMagic.length)}`);
  }
  remainingVrml = stripNextWhitespaceAndComments(
    remainingVrml.slice(expectedMagic.length).trimStart()
  );

  // potentially skip the `DEF BackgroundColor`, if any.
  remainingVrml = skipSimpleSection(remainingVrml).trim();

  if (!remainingVrml.startsWith('# Vectors')) {
    console.error('context', { remainingVrml });
    throw new Error('Expected Vectors section but did not find it');
  }
  remainingVrml = stripNextWhitespaceAndComments(remainingVrml);

  const { coordinates, remainder: coordsRemainder } = readCoordinate3(remainingVrml);
  remainingVrml = coordsRemainder.trim();

  const { material, remainder: matsRemainder } = readMaterial(remainingVrml);
  remainingVrml = matsRemainder.trim();

  const { indexValues, remainder } = readIndexedLineSet(remainingVrml);
  remainingVrml = remainder.trim();

  const lines = coordsAndLineSetToVertices(coordinates, indexValues);

  return {
    lines,
    material,
  };
}

function coordsAndLineSetToVertices(coordinates: Vector3[], indexValues: number[]) {
  const lines: Vector3[][] = [];

  let currentLine: Vector3[] = [];
  for (const idx of indexValues) {
    if (idx === -1) {
      lines.push(currentLine);
      currentLine = [];
    } else {
      const coord = coordinates[idx];
      if (!coord) {
        throw new Error(`Found idx=${idx} but no corresponding coordinate`);
      }
      currentLine.push(coord);
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}

const leadingWhitespaceOrCommentRe = /^(?:\s*#[^\n]+\n|\s+)(.*)/s;

function readMaterial(text: string) {
  const bodyRe = /^Material +{\s+emissiveColor +(?<emissive>[\d\. ]+)\s+diffuseColor +(?<diffuse>[\d\. ]+)\s*\}(?<remainder>.*)/s;

  const match = bodyRe.exec(text);
  if (!match) {
    console.error('context', { text });
    throw new Error('Did not find Material as expected');
  }

  const { emissive, diffuse, remainder } = match.groups!;

  return {
    material: {
      emissiveColor: rgbStringToColor(emissive),
      diffuseColor: rgbStringToColor(diffuse),
    } satisfies PrimitiveWallsMaterial,
    remainder,
  };
}

function rgbStringToColor(rgbStr: string) {
  const colorCompos = rgbStr.trim().split(/ +/).map(component => Number(component));
  if (colorCompos.length !== 3) {
    console.error('context', { rgbStr, colorCompos });
    throw new Error('Did not find 3 color components as expected');
  }
  const [r,g,b] = colorCompos;
  return new Color(r,g,b);
}

function readCoordinate3(text: string) {
  const bodyRe = /^Coordinate3 +{\s+point +\[\s+(?<points>[\d\.e\s,-]+)\]\s*\}(?<remainder>.*)/s;

  const match = bodyRe.exec(text);
  if (!match) {
    console.error('context', { text });
    throw new Error('Did not find Coordinate3 as expected');
  }
  const { points, remainder } = match.groups!;

  const coordinates = points.trim().split(/\s*,\s*/gs).map(
    (coordStr, i) => {
      const parts = coordStr.split(/ +/g).map(part => Number(part));
      if (parts.length !== 3) {
        throw new Error(`Coordinate3 point index ${i} had ${parts.length} parts instead of 3`);
      }
      return new Vector3(...parts);
    }
  );

  return {
    coordinates,
    remainder,
  };
}

function readIndexedLineSet(text: string) {
  const bodyRe = /^IndexedLineSet\s+{\s+coordIndex\s+\[\s+(?<indexes>[\d\s,-]+)\]\s*\}(?<remainder>.*)/s;

  const match = bodyRe.exec(text);
  if (!match) {
    console.error('context', { text });
    throw new Error('Did not find IndexedLineSet as expected');
  }
  const { indexes, remainder } = match.groups!;

  const indexValues = indexes.trim().split(/\s*,\s*/gs).map(idx => Number(idx));

  return {
    indexValues,
    remainder,
  };
}


function skipSimpleSection(text: string) {
  const defRe = /^(?:\s*\w+ +)+{[^}]+}(.*)/s;

  const match = defRe.exec(text);
  if (!match) {
    return text;
  }
  return match[1];
}

function stripNextWhitespaceAndComments(text: string): string {
  const reMatch = leadingWhitespaceOrCommentRe.exec(text);
  if (!reMatch) {
    return text;
  }
  return stripNextWhitespaceAndComments(reMatch[1]);
}

export function readNextSection(text: string) {
  const result = /^\s*(\w+)/s.exec(text);
  if (!result) {
    throw new Error(`expected section start in ${JSON.stringify(text)}`);
  }
  return result[1];
}
