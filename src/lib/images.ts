import { getImage } from 'astro:assets';

/**
 * URL di una variante ottimizzata, da usare dentro un `background-image` CSS (#42).
 *
 * Il componente `<Image>` copre solo i tag `<img>`. Per gli sfondi serve un URL, e
 * scrivere `image.src` a mano — com'era prima — salta del tutto la pipeline: Astro
 * si limita a rinominare il file originale, quindi la home serviva sei JPEG a piena
 * risoluzione per 8,6 MB complessivi.
 *
 * `width` è la larghezza **renderizzata** del contenitore già moltiplicata per il
 * fattore di densità che vogliamo coprire, non la larghezza del file sorgente.
 */
export async function bgUrl(image: ImageMetadata | undefined, width: number): Promise<string> {
  if (!image) return '';
  const optimized = await getImage({ src: image, width, format: 'webp' });
  return optimized.src;
}
