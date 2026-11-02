/** Where the money and the code live. Override the donation link with
 *  VITE_DONATE_URL at build time (see README). */
export const DONATE_URL =
  (import.meta.env.VITE_DONATE_URL as string | undefined) || 'https://ko-fi.com/jdsalasca'

export const REPO_URL = 'https://github.com/jdsalasca/open-reader'
