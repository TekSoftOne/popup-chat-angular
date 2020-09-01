import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

// Get HTML head element
const head = document.getElementsByTagName('HEAD')[0];

// Create new link Element
const link = document.createElement('link');

// set the attributes for link element
link.rel = 'stylesheet';

link.type = 'text/css';

link.href = 'http://chat-api.teksoft1.com/chatjs/styles.css';

// Append link element to HTML head
head.appendChild(link);
