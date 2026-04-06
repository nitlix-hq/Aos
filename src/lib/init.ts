import { Config } from "../types";

const resetAttributes: string[] = ["data-aos", "data-aos-easing", "data-aos-duration", "data-aos-delay"];

export default function (config: Config = {}): { destroy: () => void } {
    const {
        callback = () => { },
        easing = "ease-in-out",
        duration = 1000,
        mirror = false,
        delay = 0,
        offsetEnter = 0,
        offsetExit = 0,
        mobile = false,
        minWindowWidth = 0
    } = config;

    const disableAOS = config.disableInitFunc ?
        config.disableInitFunc()
        :
        (mobile && /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) || (window.innerWidth < minWindowWidth);

    if (disableAOS) {
        document.querySelectorAll('[data-aos]').forEach((aosElem) => {
            resetAttributes.forEach((attr) => {
                aosElem.removeAttribute(attr);
            });
        });
        return { destroy: () => { } }
    }

    const observers: IntersectionObserver[] = [];
    const managedElements: Element[] = [];
    const addedAttributes = new Map<Element, string[]>();
    const previousTransitionDelay = new WeakMap<HTMLElement, string>();

    document.querySelectorAll('[data-aos]').forEach((aosElem) => {
        const anchorString = aosElem.getAttribute("data-aos-anchor") || "";
        let anchor: Element = aosElem;
        if (anchorString) {
            try {
                anchor = document.querySelector(anchorString) || aosElem;
            } catch {
                anchor = aosElem;
            }
        }

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    aosElem.classList.add("aos-animate");
                    callback(aosElem, "enter", observer, entry);
                }
                else if (mirror) {
                    aosElem.classList.remove("aos-animate");
                    callback(aosElem, "exit", observer, entry);
                }
            });
        }, {
            rootMargin: `${offsetEnter}px 0px ${offsetExit * -1}px 0px`
        });

        observer.observe(anchor);
        observers.push(observer);
        managedElements.push(aosElem);

        aosElem.classList.add("aos-init");

        const attrs: string[] = [];
        if (!aosElem.getAttribute("data-aos-duration")) {
            aosElem.setAttribute("data-aos-duration", duration.toString());
            attrs.push("data-aos-duration");
        }
        if (!aosElem.getAttribute("data-aos-easing")) {
            aosElem.setAttribute("data-aos-easing", easing.toString());
            attrs.push("data-aos-easing");
        }
        if (!aosElem.getAttribute("data-aos-delay")) {
            aosElem.setAttribute("data-aos-delay", delay.toString());
            attrs.push("data-aos-delay");
        }

        if (aosElem instanceof HTMLElement) {
            previousTransitionDelay.set(aosElem, aosElem.style.transitionDelay);
            const delayMs = Math.max(0, Number.parseInt(aosElem.getAttribute("data-aos-delay") || "0", 10) || 0);
            aosElem.style.transitionDelay = delayMs === 0 ? "" : `${delayMs}ms`;
        }

        addedAttributes.set(aosElem, attrs);
    });

    return {
        destroy: () => {
            observers.forEach((observer) => {
                observer.disconnect();
            });
            managedElements.forEach((elem) => {
                elem.classList.remove("aos-init", "aos-animate");
                if (elem instanceof HTMLElement && previousTransitionDelay.has(elem)) {
                    const prev = previousTransitionDelay.get(elem)!;
                    if (prev) elem.style.transitionDelay = prev;
                    else elem.style.removeProperty("transition-delay");
                    previousTransitionDelay.delete(elem);
                }
                const attrs = addedAttributes.get(elem);
                if (attrs) {
                    attrs.forEach((attr) => elem.removeAttribute(attr));
                }
            });
            managedElements.length = 0;
            addedAttributes.clear();
        }
    }
}
