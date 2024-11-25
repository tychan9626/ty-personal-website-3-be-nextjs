import { supabase } from "@/lib/supabase";
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try {
        const { account_name, password } = await req.json();

        if (!account_name) {
            return new Response(
                JSON.stringify({ success: false, message: 'Missing account name.' }),
                { status: 400 }
            );
        }

        if (!password) {
            return new Response(
                JSON.stringify({ success: false, message: 'Missing password.' }),
                { status: 400 }
            );
        }

        // Step 1: Find user
        const { data: user, error: userError } = await supabase
            .from('user')
            .select('id')
            .eq('account_name', account_name)
            .eq('status', 1)
            .single();

        if (userError || !user) {
            return new Response(
                JSON.stringify({ success: false, message: 'Account does not exist.' }),
                { status: 400 }
            );
        }

        // Step 2: Find password
        const { data: userPassword, error: userPasswordError } = await supabase
            .from('user_password')
            .select('content')
            .eq('user_id', user.id)
            .eq('type', 1)
            .eq('status', 1)
            .single();

        if (!userPasswordError) {
            const { error: removePreviousPasswordError } = await supabase
                .from('user_password')
                .update({ status: 0, updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('type', 1)
                .eq('content', userPassword.content);

            if (removePreviousPasswordError) {
                return new Response(
                    JSON.stringify({ success: false, message: 'Failed to remove previous password.' }),
                    { status: 400 }
                );
            }
        }

        // Step 2: 加密密碼
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Step 3: 保存密碼
        const { error: insertError } = await supabase
            .from('user_password')
            .insert({ user_id: user.id, type: 1, content: hashedPassword, status: 1 });

        if (insertError) {
            return new Response(
                JSON.stringify({ success: false, message: 'Failed to save new password.' }),
                { status: 500 }
            );
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Registration error:', error);
        return new Response(
            JSON.stringify({ success: false, message: 'Internal Server Error' }),
            { status: 500 }
        );
    }
}
