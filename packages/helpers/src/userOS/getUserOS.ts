/**
 * Returns object with os name as key and boolean as value. Shows current user OS
 */
export function getUserOS(): { [key: string]: boolean } {
  const OS = {
    win: false,
    mac: false,
    x11: false,
    linux: false,
  };

  const userOS = Object.keys(OS).find((os: string) => window.navigator.appVersion.toLowerCase().indexOf(os) !== -1);

  if (userOS !== undefined) {
    OS[userOS] = true;

    return OS;
  }

  return OS;
}
