import type { K8sCredentials } from "../../interfaces/index.js";

export interface K8sClients {
	coreApi: InstanceType<typeof import("@kubernetes/client-node")["CoreV1Api"]>;
	kc: InstanceType<typeof import("@kubernetes/client-node")["KubeConfig"]>;
}

/**
 * Creates Kubernetes API clients from credentials
 */
export function createK8sClients(
	credentials: K8sCredentials,
): Promise<K8sClients> {
	return import("@kubernetes/client-node").then((k8s) => {
		const kc = new k8s.KubeConfig();

		switch (credentials.authMethod) {
			case "inCluster":
				kc.loadFromCluster();
				break;
			case "kubeConfigFile":
				kc.loadFromFile(credentials.kubeConfigPath || "");
				break;
			case "kubeConfigInline":
				kc.loadFromString(credentials.kubeConfigContent || "");
				break;
			default:
				throw new Error(
					`Unsupported K8s auth method: ${credentials.authMethod}`,
				);
		}

		if (credentials.kubeContext && credentials.authMethod !== "inCluster") {
			kc.setCurrentContext(credentials.kubeContext);
		}

		const coreApi = kc.makeApiClient(k8s.CoreV1Api);
		return { coreApi, kc };
	});
}
