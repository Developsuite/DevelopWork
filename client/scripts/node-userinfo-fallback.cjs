const os = require('node:os');

try {
    os.userInfo();
} catch {
    os.userInfo = () => ({
        uid: -1,
        gid: -1,
        username: process.env.USERNAME || 'developwork',
        homedir: process.env.USERPROFILE || process.cwd(),
        shell: process.env.ComSpec || 'cmd.exe',
    });
}
