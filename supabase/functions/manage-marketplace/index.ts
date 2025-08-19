import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { action, productData, cartData } = await req.json();

    console.log(`Marketplace action: ${action}`);

    switch (action) {
      case 'create-product': {
        const { data, error } = await supabaseClient
          .from('products')
          .insert({
            ...productData,
            seller_id: user.id,
          })
          .select(`
            *,
            profiles!products_seller_id_fkey(display_name)
          `)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'list-products': {
        const { data, error } = await supabaseClient
          .from('products')
          .select(`
            *,
            profiles!products_seller_id_fkey(display_name)
          `)
          .order('rating', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'add-to-cart': {
        const { product_id, quantity = 1 } = cartData;

        // Check if item already in cart
        const { data: existingItem } = await supabaseClient
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', product_id)
          .single();

        let data;
        if (existingItem) {
          // Update quantity
          const { data: updated, error } = await supabaseClient
            .from('cart_items')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id)
            .select()
            .single();
          if (error) throw error;
          data = updated;
        } else {
          // Add new item
          const { data: inserted, error } = await supabaseClient
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id,
              quantity,
            })
            .select()
            .single();
          if (error) throw error;
          data = inserted;
        }

        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-cart': {
        const { data, error } = await supabaseClient
          .from('cart_items')
          .select(`
            *,
            products(
              id, title, price, description,
              profiles!products_seller_id_fkey(display_name)
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'remove-from-cart': {
        const { cart_item_id } = cartData;
        const { error } = await supabaseClient
          .from('cart_items')
          .delete()
          .eq('id', cart_item_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update-cart-quantity': {
        const { cart_item_id, quantity } = cartData;
        const { data, error } = await supabaseClient
          .from('cart_items')
          .update({ quantity })
          .eq('id', cart_item_id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'checkout': {
        // Get cart items with product details
        const { data: cartItems, error: cartError } = await supabaseClient
          .from('cart_items')
          .select(`
            *,
            products(id, title, price, seller_id)
          `)
          .eq('user_id', user.id);

        if (cartError) throw cartError;
        if (!cartItems || cartItems.length === 0) {
          throw new Error('Cart is empty');
        }

        // Create orders for each cart item
        const orders = [];
        for (const item of cartItems) {
          const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert({
              buyer_id: user.id,
              product_id: item.product_id,
              seller_id: item.products.seller_id,
              quantity: item.quantity,
              total_amount: item.products.price * item.quantity,
              payment_status: 'pending'
            })
            .select()
            .single();

          if (orderError) throw orderError;
          orders.push(order);
        }

        // Clear cart
        await supabaseClient
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ 
          success: true, 
          orders,
          message: 'Orders created successfully. Payment processing...'
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in manage-marketplace:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});