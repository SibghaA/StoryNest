import { NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: Request, _context: { params: Params }) {
  return NextResponse.json({ data: null, error: 'Not implemented' }, { status: 501 })
}
