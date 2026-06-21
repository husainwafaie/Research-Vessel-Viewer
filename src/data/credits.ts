/**
 * credits.ts — attribution data for third-party assets used in this project.
 *
 * CC BY 4.0 requires that the author be credited wherever the work is shared.
 * This data is consumed by the UI layer to display a visible attribution notice.
 */

export interface AssetCredit {
  title: string;
  author: string;
  authorUrl: string;
  sourceUrl: string;
  licenceName: string;
  licenceUrl: string;
}

export const VESSEL_MODEL_CREDIT: AssetCredit = {
  title:       'RCRV - Regional Class Research Vessel',
  author:      'Alan Dennis',
  authorUrl:   'https://sketchfab.com/alan.dennis',
  sourceUrl:   'https://skfb.ly/6tpP9',
  licenceName: 'CC BY 4.0',
  licenceUrl:  'http://creativecommons.org/licenses/by/4.0/',
};
