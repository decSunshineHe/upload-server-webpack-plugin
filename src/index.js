const { NodeSSH } = require("node-ssh");
const chalk = require("chalk");
class UploadServerPlugin {
  constructor(options) {
    debugger;
    this.ssh = new NodeSSH();
    this.options = options;
  }

  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.afterEmit.tapAsync(
        "UploadServerPlugin",
        (compilation, callback) => {
          const outputPath = compilation.outputOptions.path;
          this.handleConnect(outputPath, callback);
        }
      );
    } else {
      compiler.plugin("after-emit", (compilation, callback) => {
        const outputPath = compilation.outputOptions.path;
        this.handleConnect(outputPath, callback);
      });
    }
  }

  handleConnect(outputPath, callback) {
    console.log(chalk.green("upload-server-plugin connet server..."));
    this.ssh
      .connect({
        host: this.options.host,
        port: this.options.port,
        username: this.options.username,
        password: this.options.password,
      })
      .then(async (res) => {
        const serverDir = this.options.remotePath;
        await this.ssh.execCommand(`rm -rf ${serverDir}/*`);
        await this.uploadFiles(outputPath, serverDir);
        this.ssh.dispose();
        callback();
      })
      .catch((err) => {
        console.log(
          chalk.red(
            `Error: upload-server-plugin connect sever ${this.options.host} failed. \n`
          )
        );
        callback();
      });
  }

  async uploadFiles(localPath, remotePath) {
    const status = await this.ssh.putDirectory(localPath, remotePath, {
      recursive: true,
      concurrency: 10,
    });
    if (status) {
      console.log(chalk.green("upload success!"));
    } else {
      console.log(chalk.red("upload failed!"));
    }
  }
}

export default UploadServerPlugin;
