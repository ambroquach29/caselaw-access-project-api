import { Buffer } from 'buffer';

export interface PaginationArgs {
  first?: number | undefined;
  after?: string | undefined;
}

export interface PaginationResult<T> {
  edges: Array<{
    node: T;
    cursor: string;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}

export interface CursorPaginationParams {
  take: number;
  skip?: number;
  cursor?: {
    id: number;
  };
}

/**
 * Encode a cursor from an ID
 */
export function encodeCursor(id: number): string {
  return Buffer.from(id.toString()).toString('base64');
}

/**
 * Decode a cursor to an ID
 */
export function decodeCursor(cursor: string): number {
  return parseInt(Buffer.from(cursor, 'base64').toString(), 10);
}

/**
 * Parse pagination arguments from GraphQL query
 */
export function parsePaginationArgs(
  args: PaginationArgs
): CursorPaginationParams {
  const { first = 10, after } = args;

  const take = Math.min(first, 100); // Limit to 100 items per page
  const params: CursorPaginationParams = { take };

  if (after) {
    try {
      const decodedId = decodeCursor(after);
      params.cursor = { id: decodedId };
      params.skip = 1; // Skip the cursor item itself
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  }

  return params;
}

/**
 * Create pagination result from database query
 */
export function createPaginationResult<T>(
  items: T[],
  totalCount: number,
  hasNextPage: boolean,
  hasPreviousPage: boolean
): PaginationResult<T> {
  const edges = items.map((item: any) => ({
    node: item,
    cursor: encodeCursor(item.id),
  }));

  const firstEdge = edges[0];
  const lastEdge = edges[edges.length - 1];

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: firstEdge ? firstEdge.cursor : null,
      endCursor: lastEdge ? lastEdge.cursor : null,
    },
    totalCount,
  };
}
