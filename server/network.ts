import os from 'os';

export function getLocalIpAddresses(): { primaryIp: string; allIps: string[] } {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;

    for (const net of netList) {
      // IPv4 and not internal loopback
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  // Pick the most likely LAN IP (e.g. 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const preferredIp = addresses.find(ip => 
    ip.startsWith('192.168.') || 
    ip.startsWith('10.') || 
    ip.startsWith('172.')
  ) || addresses[0] || 'localhost';

  return {
    primaryIp: preferredIp,
    allIps: addresses.length > 0 ? addresses : ['localhost'],
  };
}
