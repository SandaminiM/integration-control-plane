/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { gql } from './graphql';
import { choreoClient, withScopeRetry } from './httpClients';
import type { Certificate, CreateCertificateInput } from '../../types/certificates';
import type { ConfigGroup, ConfigGroupUsage } from '../../types/configGroups';

const BASE = '/config-svc/v1.0/configs/groups';
export const CERTIFICATE_GROUP_PREFIX = 'certificates-';

/** Certificates are stored as config groups whose name carries the certificates- prefix. */
export async function listCertificateGroups(): Promise<ConfigGroup[]> {
  const groups = await withScopeRetry(() => choreoClient.get<ConfigGroup[]>(`${BASE}?type=internal_user`));
  return groups.filter((g) => g.groupName.startsWith(CERTIFICATE_GROUP_PREFIX));
}

const CREATE_MUTATION = `mutation CreateCertificate($input: CreateCertificateInput!) { createCertificate(input: $input) { id groupName name description certificateType createdAt environments metadata { notAfter notBefore issuer subject subjectCN subjectO subjectOU issuerCN issuerO issuerOU sigAlgName version sha1 sha256 } } }`;

export async function createCertificate(input: CreateCertificateInput): Promise<Certificate> {
  const data = await gql<{ createCertificate: Certificate }>(CREATE_MUTATION, { input });
  return data.createCertificate;
}

export async function deleteCertificate(certificateId: string): Promise<boolean> {
  const data = await gql<{ deleteCertificate: boolean }>(
    `mutation DeleteCertificate { deleteCertificate(certificateId: ${JSON.stringify(certificateId)}) }`,
  );
  return data.deleteCertificate;
}

interface RawCertificateUsage {
  certificateId: string;
  projects:
    | {
        projectId: string;
        projectName: string;
        projectHandler: string;
        components: {
          componentId: string;
          componentName: string;
          componentHandler: string;
          environments: { envTemplateId: string; envTemplateName: string }[];
        }[];
      }[]
    | null;
}

export async function getCertificateUsage(certificateId: string): Promise<ConfigGroupUsage> {
  const query = `query CertificateUsage { certificateUsage(certificateId: ${JSON.stringify(certificateId)}) { certificateId projects { projectId projectName projectHandler components { componentId componentName componentHandler environments { envTemplateId envTemplateName } } } } }`;
  const data = await gql<{ certificateUsage: RawCertificateUsage }>(query);
  const raw = data.certificateUsage;
  return {
    configGroupId: raw.certificateId,
    usageInProjects: (raw.projects ?? []).map((p) => ({
      projectId: p.projectId,
      projectName: p.projectName,
      projectHandler: p.projectHandler,
      usageInComponents: p.components.map((c) => ({
        componentId: c.componentId,
        componentName: c.componentName,
        componentHandler: c.componentHandler,
        usageInReleases: c.environments.map((e) => ({ envTemplateId: e.envTemplateId, envTemplateName: e.envTemplateName })),
      })),
    })),
  };
}
