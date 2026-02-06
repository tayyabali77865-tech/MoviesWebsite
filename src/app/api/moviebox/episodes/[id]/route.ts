import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // This endpoint was previously for Netflix. 
    // MovieBox episode integration is pending discovery of correct detail endpoint.
    return NextResponse.json({ seasons: [], error: 'MovieBox episode fetching not yet implemented' });
}
