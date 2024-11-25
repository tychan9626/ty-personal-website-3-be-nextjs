import bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try {
      const { password } = await req.json();
  
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      return new Response(JSON.stringify({ success: true, message: hashedPassword}), { status: 200 });
    } catch (error) {
      console.error('Registration error:', error);
      return new Response(
        JSON.stringify({ success: false, message: 'Internal Server Error' }),
        { status: 500 }
      );
    }
  }
  