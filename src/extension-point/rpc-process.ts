import * as vscode from "vscode";

import { logger } from "./logger";
import { RpcProcessManager } from "../lib/rpc-process-manager";
import { IRPCProcessLaunchContext } from "../types/rpc-process";
import { shouldInstallGlobally } from "../settings";

export async function enrollRpcProcess(
  vscodeContext: vscode.ExtensionContext,
  processLaunchContext: IRPCProcessLaunchContext
) {
  const rpcProcessManager = new RpcProcessManager(processLaunchContext, logger);
  vscodeContext.subscriptions.push(rpcProcessManager);

  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    await rpcProcessManager.startRpcProcess(folder.uri.fsPath);
  }

  vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
    for (const folder of event.removed) {
      rpcProcessManager.stopRpcProcess(folder.uri.fsPath);
    }
    for (const folder of event.added) {
      await rpcProcessManager.startRpcProcess(folder.uri.fsPath);
    }
  });

  if ( !processLaunchContext.locateGlobalServiceDirectoryVirtualEnvDir() && shouldInstallGlobally() ) {
    logger("[rpc-process] No global service directory found, running installer.");
    vscode.commands.executeCommand("opentips.installPackage");
  }
}
