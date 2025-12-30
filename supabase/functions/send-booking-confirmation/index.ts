import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  name: string;
  age: string;
  gender: string;
  whatsapp: string;
  email?: string;
  reason: string;
  consultationType: 'online' | 'clinic';
  consultationMode?: 'chat' | 'audio';
  serviceName: string;
  serviceCharge: number;
  date: string;
  timeSlot: string;
  paymentMethod?: string;
  attachmentUrls?: string[];
  paymentScreenshotUrl?: string;
  suggestions?: string;
}

// Input validation and sanitization
function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function validateBookingRequest(data: Record<string, any>): { valid: boolean; error?: string } {
  if (!data.name || typeof data.name !== 'string' || data.name.length > 100) {
    return { valid: false, error: 'Invalid name' };
  }
  if (!data.age || typeof data.age !== 'string' || !/^\d+$/.test(data.age)) {
    return { valid: false, error: 'Invalid age' };
  }
  const ageNum = parseInt(data.age);
  if (ageNum < 1 || ageNum > 120) {
    return { valid: false, error: 'Age must be between 1 and 120' };
  }
  if (!['male', 'female', 'other'].includes(data.gender)) {
    return { valid: false, error: 'Invalid gender' };
  }
  if (!data.whatsapp || typeof data.whatsapp !== 'string' || data.whatsapp.length > 20) {
    return { valid: false, error: 'Invalid WhatsApp number' };
  }
  if (data.email && (typeof data.email !== 'string' || data.email.length > 255)) {
    return { valid: false, error: 'Invalid email' };
  }
  if (!data.reason || typeof data.reason !== 'string' || data.reason.length > 1000) {
    return { valid: false, error: 'Invalid reason' };
  }
  if (!data.serviceName || typeof data.serviceName !== 'string') {
    return { valid: false, error: 'Invalid service name' };
  }
  return { valid: true };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);
    
    // Check current rate limit
    const { data: rateLimit } = await supabase
      .from('function_rate_limits')
      .select('request_count')
      .eq('function_name', 'send-booking-confirmation')
      .eq('identifier', clientIP)
      .gte('window_start', currentHour.toISOString())
      .single();
    
    if (rateLimit && rateLimit.request_count >= 5) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Increment or create rate limit record
    await supabase
      .from('function_rate_limits')
      .upsert({
        function_name: 'send-booking-confirmation',
        identifier: clientIP,
        window_start: currentHour.toISOString(),
        request_count: (rateLimit?.request_count || 0) + 1,
      }, {
        onConflict: 'function_name,identifier,window_start'
      });

    const bookingData: BookingEmailRequest = await req.json();
    
    // Validate input
    const validation = validateBookingRequest(bookingData);
    if (!validation.valid) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Sanitize all text inputs for HTML output
    const sanitizedName = sanitizeHtml(bookingData.name);
    const sanitizedReason = sanitizeHtml(bookingData.reason);
    const sanitizedServiceName = sanitizeHtml(bookingData.serviceName);
    const sanitizedEmail = bookingData.email ? sanitizeHtml(bookingData.email) : '';
    const paymentMethodText = bookingData.paymentMethod === 'pay-later' 
      ? 'Pay when consultation starts with doctor' 
      : 'UPI Payment (Completed)';
    
    const consultationModeText = bookingData.consultationMode === 'audio' ? 'Audio Call' : 'Chat';
    const sanitizedSuggestions = bookingData.suggestions ? sanitizeHtml(bookingData.suggestions) : '';
    
    console.log("Processing booking confirmation - Service:", bookingData.serviceName);

    // Email content for customer
    const customerEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Dr. Deogade Clinic</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Professional Medical Care & Teleconsultation</p>
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 22px;">✅ Appointment Confirmed!</h2>
            <p style="color: #374151; margin: 0; font-size: 16px;">Dear ${sanitizedName}, your appointment has been successfully booked.</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Appointment Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Patient Name:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${sanitizedName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Age:</td>
                <td style="padding: 8px 0; color: #111827;">${bookingData.age} years</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Gender:</td>
                <td style="padding: 8px 0; color: #111827;">${bookingData.gender}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Service Type:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${sanitizedServiceName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Consultation Charge:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600;">₹${bookingData.serviceCharge}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Payment Method:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${paymentMethodText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Consultation Type:</td>
                <td style="padding: 8px 0; color: #111827; text-transform: capitalize;">${bookingData.consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}</td>
              </tr>
              ${bookingData.consultationType === 'online' && bookingData.consultationMode ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Mode of Consultation:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${consultationModeText}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Date:</td>
                <td style="padding: 8px 0; color: #111827;">${bookingData.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Time:</td>
                <td style="padding: 8px 0; color: #111827;">${bookingData.timeSlot}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">WhatsApp:</td>
                <td style="padding: 8px 0; color: #111827;">${bookingData.whatsapp}</td>
              </tr>
              ${bookingData.email ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
                <td style="padding: 8px 0; color: #111827;">${sanitizedEmail}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Reason:</td>
                <td style="padding: 8px 0; color: #111827;">${sanitizedReason}</td>
              </tr>
              ${sanitizedSuggestions ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Patient Notes:</td>
                <td style="padding: 8px 0; color: #111827;">${sanitizedSuggestions}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Important Instructions:</h3>
            <ul style="color: #78350f; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 5px;">Please arrive 10 minutes early for in-clinic visits</li>
              <li style="margin-bottom: 5px;">For online consultations, you'll receive a call on your WhatsApp number</li>
              <li style="margin-bottom: 5px;">Bring your medical history and current medications</li>
              <li>If you need to reschedule, please contact us at least 2 hours in advance</li>
            </ul>
          </div>

          <div style="text-align: center; padding: 20px; background-color: #f1f5f9; border-radius: 8px;">
            <h3 style="color: #334155; margin: 0 0 10px 0;">Need to Contact Us?</h3>
            <p style="color: #64748b; margin: 0 0 10px 0;">WhatsApp: <strong>+91 7415379845</strong></p>
            <p style="color: #64748b; margin: 0 0 10px 0;">Email: <strong>drteleconsultation@gmail.com</strong></p>
            <p style="color: #64748b; margin: 0;">Address: 419/B, Dev Arch Apartment, near Krida Chowk, Nagpur</p>
          </div>
        </div>
      </div>
    `;

    // Email content for clinic
    const clinicEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">New Appointment Booking</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
          <h3>Patient Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Patient Name:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500;">${sanitizedName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Age:</td>
              <td style="padding: 8px 0; color: #111827;">${bookingData.age} years</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Gender:</td>
              <td style="padding: 8px 0; color: #111827;">${bookingData.gender}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Service Type:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500;">${sanitizedServiceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Consultation Charge:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">₹${bookingData.serviceCharge}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Payment Method:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500;">${paymentMethodText}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Consultation Type:</td>
              <td style="padding: 8px 0; color: #111827; text-transform: capitalize;">${bookingData.consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}</td>
            </tr>
            ${bookingData.consultationType === 'online' && bookingData.consultationMode ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Mode of Consultation:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 500;">${consultationModeText}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Date:</td>
              <td style="padding: 8px 0; color: #111827;">${bookingData.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Time:</td>
              <td style="padding: 8px 0; color: #111827;">${bookingData.timeSlot}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">WhatsApp:</td>
              <td style="padding: 8px 0; color: #111827;">${bookingData.whatsapp}</td>
            </tr>
            ${bookingData.email ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0; color: #111827;">${sanitizedEmail}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Reason for Visit:</td>
              <td style="padding: 8px 0; color: #111827;">${sanitizedReason}</td>
            </tr>
            ${sanitizedSuggestions ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Patient Notes/Suggestions:</td>
              <td style="padding: 8px 0; color: #111827;">${sanitizedSuggestions}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      </div>
    `;

    // Prepare attachments for email if any
    const attachments = [];
    
    // Process medical document attachments
    if (bookingData.attachmentUrls && bookingData.attachmentUrls.length > 0) {
      console.log(`Processing ${bookingData.attachmentUrls.length} medical document(s)`);
      for (const url of bookingData.attachmentUrls) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('medical-documents')
            .download(url);
          
          if (!downloadError && fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            
            // Convert to base64 in chunks to avoid stack overflow
            let base64Content = '';
            const chunkSize = 8192;
            for (let i = 0; i < buffer.length; i += chunkSize) {
              const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));
              base64Content += String.fromCharCode(...chunk);
            }
            base64Content = btoa(base64Content);
            
            attachments.push({
              filename: url.split('/').pop() || 'medical-document',
              content: base64Content,
            });
            console.log(`Medical document added: ${url.split('/').pop()}`);
          }
        } catch (err) {
          console.error(`Error downloading medical document ${url}:`, err);
        }
      }
    }
    
    // Process payment screenshot attachment
    if (bookingData.paymentScreenshotUrl) {
      console.log(`Processing payment screenshot: ${bookingData.paymentScreenshotUrl}`);
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('medical-documents')
          .download(bookingData.paymentScreenshotUrl);
        
        if (!downloadError && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);
          
          // Convert to base64 in chunks to avoid stack overflow
          let base64Content = '';
          const chunkSize = 8192;
          for (let i = 0; i < buffer.length; i += chunkSize) {
            const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));
            base64Content += String.fromCharCode(...chunk);
          }
          base64Content = btoa(base64Content);
          
          attachments.push({
            filename: bookingData.paymentScreenshotUrl.split('/').pop() || 'payment-screenshot',
            content: base64Content,
          });
          console.log(`Payment screenshot added: ${bookingData.paymentScreenshotUrl.split('/').pop()}`);
        }
      } catch (err) {
        console.error(`Error downloading payment screenshot ${bookingData.paymentScreenshotUrl}:`, err);
      }
    }
    
    console.log(`Total attachments prepared: ${attachments.length}`);

    let customerEmail;
    
    // Send customer confirmation email only if email is provided
    if (bookingData.email) {
      customerEmail = await resend.emails.send({
        from: 'Dr. Deogade Clinic <onboarding@resend.dev>',
        to: [bookingData.email],
        subject: 'Appointment Confirmation - Dr. Deogade Clinic',
        html: customerEmailContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      console.log('Customer email sent successfully');
    }

    // Send clinic notification email (always sent)
    const clinicEmail = await resend.emails.send({
      from: 'Dr. Deogade Clinic <onboarding@resend.dev>',
      to: ['drteleconsultation@gmail.com'],
      subject: `New Appointment: ${bookingData.serviceName} - ${bookingData.date} at ${bookingData.timeSlot}`,
      html: clinicEmailContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log('Clinic email sent successfully');
    
    // Trigger Zapier webhook for Google Calendar integration
    const zapierWebhookUrl = Deno.env.get('ZAPIER_WEBHOOK_URL');
    if (zapierWebhookUrl) {
      try {
        console.log('Triggering Zapier webhook for calendar integration');
        const calendarData = {
          summary: `${sanitizedServiceName} - ${sanitizedName}`,
          description: `Patient: ${sanitizedName}\nAge: ${bookingData.age}\nGender: ${bookingData.gender}\nWhatsApp: ${bookingData.whatsapp}${bookingData.email ? `\nEmail: ${sanitizedEmail}` : ''}\nReason: ${sanitizedReason}\nConsultation Type: ${bookingData.consultationType}\nPayment: ${paymentMethodText}`,
          location: bookingData.consultationType === 'online' ? 'Online Consultation' : 'Dr. Deogade Clinic, 419/B, Dev Arch Apartment, near Krida Chowk, Nagpur',
          start: {
            dateTime: `${bookingData.date}T${bookingData.timeSlot}:00`,
            timeZone: 'Asia/Kolkata'
          },
          end: {
            dateTime: `${bookingData.date}T${bookingData.timeSlot}:00`,
            timeZone: 'Asia/Kolkata'
          },
          attendees: [
            { email: 'drteleconsultation@gmail.com' },
            ...(bookingData.email ? [{ email: bookingData.email }] : [])
          ],
          patientName: sanitizedName,
          age: bookingData.age,
          gender: bookingData.gender,
          whatsapp: bookingData.whatsapp,
          email: sanitizedEmail,
          reason: sanitizedReason,
          consultationType: bookingData.consultationType,
          serviceName: sanitizedServiceName,
          appointmentDate: bookingData.date,
          timeSlot: bookingData.timeSlot
        };

        const zapierResponse = await fetch(zapierWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarData),
        });

        console.log('Zapier webhook triggered successfully, status:', zapierResponse.status);
      } catch (zapierError) {
        console.error('Error triggering Zapier webhook:', zapierError);
        // Don't fail the entire request if Zapier fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      customerEmailId: customerEmail?.data?.id,
      clinicEmailId: clinicEmail.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in send-booking-confirmation function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);