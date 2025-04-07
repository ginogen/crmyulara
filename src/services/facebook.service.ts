import { FacebookAccount, FacebookForm } from '@/types/facebook';

export class FacebookService {
  private static FB: any;
  private static APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  static async initialize(): Promise<void> {
    return new Promise((resolve) => {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: FacebookService.APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        FacebookService.FB = window.FB;
        resolve();
      };

      // Cargar el SDK de Facebook
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/es_LA/sdk.js";
        fjs.parentNode?.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    });
  }

  static async login(): Promise<string> {
    return new Promise((resolve, reject) => {
      FacebookService.FB.login((response: any) => {
        if (response.authResponse) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error('Usuario canceló el inicio de sesión o ocurrió un error'));
        }
      }, {
        scope: 'pages_show_list,leads_retrieval,pages_read_engagement'
      });
    });
  }

  static async getAccounts(): Promise<FacebookAccount[]> {
    return new Promise((resolve, reject) => {
      FacebookService.FB.api('/me/accounts', async (response: any) => {
        if (response.error) {
          reject(new Error(response.error.message));
          return;
        }

        try {
          const accounts: FacebookAccount[] = await Promise.all(
            response.data.map(async (account: any) => {
              const forms = await FacebookService.getPageForms(account.id);
              return {
                id: account.id,
                name: account.name,
                forms
              };
            })
          );
          resolve(accounts);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  static async getPageForms(pageId: string): Promise<FacebookForm[]> {
    return new Promise((resolve, reject) => {
      FacebookService.FB.api(
        `/${pageId}/leadgen_forms`,
        'GET',
        {},
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error.message));
            return;
          }

          const forms: FacebookForm[] = response.data.map((form: any) => ({
            id: form.id,
            name: form.name,
            status: form.status
          }));

          resolve(forms);
        }
      );
    });
  }

  static async subscribeToFormLeads(pageId: string, formIds: string[]): Promise<void> {
    // TODO: Implementar la lógica para suscribirse a los webhooks de los formularios
    // 1. Configurar el webhook en el servidor
    // 2. Suscribirse a los eventos de lead_gen
    // 3. Guardar la configuración en la base de datos
  }
} 