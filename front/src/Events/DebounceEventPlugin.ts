import { ListenerOptions } from "@angular/core";
import { EventManagerPlugin } from "@angular/platform-browser";

export class DebounceEventPlugin extends EventManagerPlugin
{
    // permet de savoir ne nom de l'event et de bloquer ou non l'event
    override supports(eventName: string): boolean 
    {
        return eventName.startsWith("keyup.debounce");
    }

    override addEventListener(
        element: HTMLElement, 
        eventName: string, 
        handler: Function, 
        options?: ListenerOptions
    ): Function 
    {
        const EVENT_LISTE = eventName.split(".");
        const EVENT = EVENT_LISTE[0];
        const TEMPS = EVENT_LISTE[2] ?? 300;
        
        const wrappedHandler = this.debounce((event: Event) => 
        {
            // On re entre dans la zone Angular uniquement quand le timer expire
            // pour mettre à jour la vue (si nécessaire)
            this.manager.getZone().run(() => handler(event));
        }, +TEMPS);

        // pour que les frappes de clavier intermédiaires
        // ne déclenchent pas la détection de changement inutilement.
        return this.manager.getZone().runOutsideAngular(() =>
            this.manager.addEventListener(element, EVENT, wrappedHandler)
        );
    }

    private debounce(_func, _timeout = 300): Function
    {
        let timer;
        return (...args) => 
        {
            clearTimeout(timer);
            timer = setTimeout(() => { _func.apply(this, args); }, _timeout);
        };
    }
}