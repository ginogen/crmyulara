import { createClient } from '@/lib/supabase/client';
import { Budget } from '@/types/supabase';
import { formatDate } from '@/lib/utils/dates';
import { notFound } from 'next/navigation';
import { MapIcon, CalendarIcon, CreditCardIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface BudgetPageProps {
  params: {
    slug: string;
  };
}

export default async function BudgetPage({ params }: BudgetPageProps) {
  const supabase = createClient();
  
  const { data: budget } = await supabase
    .from('budgets')
    .select('*, contacts(*)')
    .eq('slug', params.slug)
    .single();

  if (!budget) {
    notFound();
  }

  const {
    title,
    description,
    rates,
    valid_until,
    payment_terms,
    notes,
    theme_settings,
    contacts,
    responsible
  } = budget as Budget & { contacts: { full_name: string; email: string; phone: string } };

  return (
    <div className={`min-h-screen ${theme_settings.font_family}`}>
      {/* Hero Section with Background */}
      <div 
        className="relative h-96 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between py-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              {theme_settings.logo_url && (
                <img 
                  src={theme_settings.logo_url} 
                  alt="Logo" 
                  className="h-16 w-auto bg-white p-2 rounded-lg"
                />
              )}
              <div className="text-right">
                <p className="text-white text-sm opacity-80">Válido hasta</p>
                <p className="text-white text-lg font-semibold">
                  {formatDate(valid_until)}
                </p>
              </div>
            </div>
            
            {/* Title */}
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: theme_settings.primary_color }}>
                {title}
              </h1>
              <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-20">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Contact Information */}
          <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: theme_settings.secondary_color }}>
              Información del Viajero
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Nombre</p>
                <p className="font-medium text-lg">{contacts.full_name}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-lg">{contacts.email}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                <p className="font-medium text-lg">{contacts.phone}</p>
              </div>
            </div>
          </div>

          {/* Rates */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center mb-6">
              <MapIcon className="h-6 w-6 mr-2" style={{ color: theme_settings.secondary_color }} />
              <h2 className="text-2xl font-semibold" style={{ color: theme_settings.secondary_color }}>
                Detalles del Viaje
              </h2>
            </div>
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-6">
                {rates.split('\n').map((line, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <p className="text-lg">{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center mb-6">
              <CreditCardIcon className="h-6 w-6 mr-2" style={{ color: theme_settings.secondary_color }} />
              <h2 className="text-2xl font-semibold" style={{ color: theme_settings.secondary_color }}>
                Términos de Pago
              </h2>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-lg">{payment_terms}</p>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="px-6 py-8 border-b border-gray-200">
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-6 w-6 mr-2" style={{ color: theme_settings.secondary_color }} />
                <h2 className="text-2xl font-semibold" style={{ color: theme_settings.secondary_color }}>
                  Información Adicional
                </h2>
              </div>
              <div className="prose max-w-none bg-gray-50 rounded-lg p-6">
                {notes.split('\n').map((line, index) => (
                  <p key={index} className="mb-2 text-lg">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Contact Agent */}
          <div className="px-6 py-8 bg-gradient-to-r from-gray-50 to-white">
            <div className="text-center">
              <h3 className="text-xl font-medium mb-2" style={{ color: theme_settings.secondary_color }}>
                ¿Tienes alguna pregunta?
              </h3>
              <p className="text-lg mb-4">Tu asesor de viajes está aquí para ayudarte</p>
              <div className="inline-block bg-white rounded-lg px-6 py-4 shadow-sm">
                <p className="font-medium text-lg" style={{ color: theme_settings.primary_color }}>
                  {responsible}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <CalendarIcon className="h-8 w-8 mx-auto mb-4" style={{ color: theme_settings.primary_color }} />
              <h4 className="text-lg font-medium mb-2">Validez</h4>
              <p>Este presupuesto es válido hasta el {formatDate(valid_until)}</p>
            </div>
            <div>
              <CreditCardIcon className="h-8 w-8 mx-auto mb-4" style={{ color: theme_settings.primary_color }} />
              <h4 className="text-lg font-medium mb-2">Pagos Seguros</h4>
              <p>Múltiples métodos de pago disponibles</p>
            </div>
            <div>
              <DocumentTextIcon className="h-8 w-8 mx-auto mb-4" style={{ color: theme_settings.primary_color }} />
              <h4 className="text-lg font-medium mb-2">Asistencia 24/7</h4>
              <p>Soporte durante todo tu viaje</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 