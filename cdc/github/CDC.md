# GitHub v3 REST API — CDC (Code-Call Descriptor)

Base URL: https://api.github.com
## How to call this API (CDC pattern)

Write ONE Node.js (18+) script per question. Rules:
1. No auth scheme declared; many endpoints may work unauthenticated.
2. Fetch only what you need; paginate with per_page/page params where offered.
3. Do ALL filtering/aggregation/arithmetic IN THE SCRIPT — never in your head.
4. Print ONLY the final answer to stdout. Raw API payloads must never be
   echoed, logged, or pasted into the conversation.
5. On HTTP errors, print status + first 200 chars of the body and stop.

Query params: `*` = required. Response shapes show top-level fields only.

## actions
GET /enterprises/{enterprise}/actions/cache/retention-limit -> {max_cache_retention_days} — Get GitHub Actions cache retention limit for an enterprise
PUT /enterprises/{enterprise}/actions/cache/retention-limit body:{max_cache_retention_days} -> ? — Set GitHub Actions cache retention limit for an enterprise
GET /enterprises/{enterprise}/actions/cache/storage-limit -> {max_cache_size_gb} — Get GitHub Actions cache storage limit for an enterprise
PUT /enterprises/{enterprise}/actions/cache/storage-limit body:{max_cache_size_gb} -> ? — Set GitHub Actions cache storage limit for an enterprise
GET /organizations/{org}/actions/cache/retention-limit -> {max_cache_retention_days} — Get GitHub Actions cache retention limit for an organization
PUT /organizations/{org}/actions/cache/retention-limit body:{max_cache_retention_days} -> ? — Set GitHub Actions cache retention limit for an organization
GET /organizations/{org}/actions/cache/storage-limit -> {max_cache_size_gb} — Get GitHub Actions cache storage limit for an organization
PUT /organizations/{org}/actions/cache/storage-limit body:{max_cache_size_gb} -> ? — Set GitHub Actions cache storage limit for an organization
GET /orgs/{org}/actions/cache/usage -> {total_active_caches_count,total_active_caches_size_in_bytes} — Get GitHub Actions cache usage for an organization
GET /orgs/{org}/actions/cache/usage-by-repository?per_page&page -> {total_count,repository_cache_usages} — List repositories with GitHub Actions cache usage for an organization
GET /orgs/{org}/actions/hosted-runners?per_page&page -> {total_count,runners} — List GitHub-hosted runners for an organization
POST /orgs/{org}/actions/hosted-runners body:{name,image,size,runner_group_id,maximum_runners,enable_static_ip,image_gen} -> {id,name,runner_group_id,image_details,machine_size_details,status,platform,maximum_runners,public_ip_enabled,public_ips,last_active_on,image_gen} — Create a GitHub-hosted runner for an organization
GET /orgs/{org}/actions/hosted-runners/images/custom -> {total_count,images} — List custom images for an organization
GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id} -> {id,platform,total_versions_size,name,source,versions_count,latest_version,state} — Get a custom image definition for GitHub Actions Hosted Runners
DELETE /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id} -> ? — Delete a custom image from the organization
GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions -> {total_count,image_versions} — List image versions of a custom image for an organization
GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions/{version} -> {version,state,size_gb,created_on,state_details} — Get an image version of a custom image for GitHub Actions Hosted Runners
DELETE /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions/{version} -> ? — Delete an image version of custom image from the organization
GET /orgs/{org}/actions/hosted-runners/images/github-owned -> {total_count,images} — Get GitHub-owned images for GitHub-hosted runners in an organization
GET /orgs/{org}/actions/hosted-runners/images/partner -> {total_count,images} — Get partner images for GitHub-hosted runners in an organization
GET /orgs/{org}/actions/hosted-runners/limits -> {public_ips} — Get limits on GitHub-hosted runners for an organization
GET /orgs/{org}/actions/hosted-runners/machine-sizes -> {total_count,machine_specs} — Get GitHub-hosted runners machine specs for an organization
GET /orgs/{org}/actions/hosted-runners/platforms -> {total_count,platforms} — Get platforms for GitHub-hosted runners in an organization
GET /orgs/{org}/actions/hosted-runners/{hosted_runner_id} -> {id,name,runner_group_id,image_details,machine_size_details,status,platform,maximum_runners,public_ip_enabled,public_ips,last_active_on,image_gen} — Get a GitHub-hosted runner for an organization
PATCH /orgs/{org}/actions/hosted-runners/{hosted_runner_id} body:{name,runner_group_id,maximum_runners,enable_static_ip,size,image_source,image_id,image_version,image_gen} -> {id,name,runner_group_id,image_details,machine_size_details,status,platform,maximum_runners,public_ip_enabled,public_ips,last_active_on,image_gen} — Update a GitHub-hosted runner for an organization
DELETE /orgs/{org}/actions/hosted-runners/{hosted_runner_id} -> {id,name,runner_group_id,image_details,machine_size_details,status,platform,maximum_runners,public_ip_enabled,public_ips,last_active_on,image_gen} — Delete a GitHub-hosted runner for an organization
GET /orgs/{org}/actions/permissions -> {enabled_repositories,selected_repositories_url,allowed_actions,selected_actions_url,sha_pinning_required} — Get GitHub Actions permissions for an organization
PUT /orgs/{org}/actions/permissions body:{enabled_repositories,allowed_actions,sha_pinning_required} -> ? — Set GitHub Actions permissions for an organization
GET /orgs/{org}/actions/permissions/artifact-and-log-retention -> {days,maximum_allowed_days} — Get artifact and log retention settings for an organization
PUT /orgs/{org}/actions/permissions/artifact-and-log-retention body:{days} -> ? — Set artifact and log retention settings for an organization
GET /orgs/{org}/actions/permissions/fork-pr-contributor-approval -> {approval_policy} — Get fork PR contributor approval permissions for an organization
PUT /orgs/{org}/actions/permissions/fork-pr-contributor-approval body:{approval_policy} -> ? — Set fork PR contributor approval permissions for an organization
GET /orgs/{org}/actions/permissions/fork-pr-workflows-private-repos -> {run_workflows_from_fork_pull_requests,send_write_tokens_to_workflows,send_secrets_and_variables,require_approval_for_fork_pr_workflows} — Get private repo fork PR workflow settings for an organization
PUT /orgs/{org}/actions/permissions/fork-pr-workflows-private-repos body:{run_workflows_from_fork_pull_requests,send_write_tokens_to_workflows,send_secrets_and_variables,require_approval_for_fork_pr_workflows} -> ? — Set private repo fork PR workflow settings for an organization
GET /orgs/{org}/actions/permissions/repositories?per_page&page -> {total_count,repositories} — List selected repositories enabled for GitHub Actions in an organization
PUT /orgs/{org}/actions/permissions/repositories body:{selected_repository_ids} -> ? — Set selected repositories enabled for GitHub Actions in an organization
PUT /orgs/{org}/actions/permissions/repositories/{repository_id} -> ? — Enable a selected repository for GitHub Actions in an organization
DELETE /orgs/{org}/actions/permissions/repositories/{repository_id} -> ? — Disable a selected repository for GitHub Actions in an organization
GET /orgs/{org}/actions/permissions/selected-actions -> {github_owned_allowed,verified_allowed,patterns_allowed} — Get allowed actions and reusable workflows for an organization
PUT /orgs/{org}/actions/permissions/selected-actions body:{github_owned_allowed,verified_allowed,patterns_allowed} -> ? — Set allowed actions and reusable workflows for an organization
GET /orgs/{org}/actions/permissions/self-hosted-runners -> {enabled_repositories,selected_repositories_url} — Get self-hosted runners settings for an organization
PUT /orgs/{org}/actions/permissions/self-hosted-runners body:{enabled_repositories} -> ? — Set self-hosted runners settings for an organization
GET /orgs/{org}/actions/permissions/self-hosted-runners/repositories?per_page&page -> {total_count,repositories} — List repositories allowed to use self-hosted runners in an organization
PUT /orgs/{org}/actions/permissions/self-hosted-runners/repositories body:{selected_repository_ids} -> ? — Set repositories allowed to use self-hosted runners in an organization
PUT /orgs/{org}/actions/permissions/self-hosted-runners/repositories/{repository_id} -> ? — Add a repository to the list of repositories allowed to use self-hosted runners in an organization
DELETE /orgs/{org}/actions/permissions/self-hosted-runners/repositories/{repository_id} -> ? — Remove a repository from the list of repositories allowed to use self-hosted runners in an organization
GET /orgs/{org}/actions/permissions/workflow -> {default_workflow_permissions,can_approve_pull_request_reviews} — Get default workflow permissions for an organization
PUT /orgs/{org}/actions/permissions/workflow body:{default_workflow_permissions,can_approve_pull_request_reviews} -> ? — Set default workflow permissions for an organization
GET /orgs/{org}/actions/runner-groups?per_page&page&visible_to_repository -> {total_count,runner_groups} — List self-hosted runner groups for an organization
POST /orgs/{org}/actions/runner-groups body:{name,visibility,selected_repository_ids,runners,allows_public_repositories,restricted_to_workflows,selected_workflows,network_configuration_id} -> {id,name,visibility,default,selected_repositories_url,runners_url,hosted_runners_url,network_configuration_id,inherited,inherited_allows_public_repositories,allows_public_repositories,workflow_restrictions_read_only,+2more} — Create a self-hosted runner group for an organization
GET /orgs/{org}/actions/runner-groups/{runner_group_id} -> {id,name,visibility,default,selected_repositories_url,runners_url,hosted_runners_url,network_configuration_id,inherited,inherited_allows_public_repositories,allows_public_repositories,workflow_restrictions_read_only,+2more} — Get a self-hosted runner group for an organization
PATCH /orgs/{org}/actions/runner-groups/{runner_group_id} body:{name,visibility,allows_public_repositories,restricted_to_workflows,selected_workflows,network_configuration_id} -> {id,name,visibility,default,selected_repositories_url,runners_url,hosted_runners_url,network_configuration_id,inherited,inherited_allows_public_repositories,allows_public_repositories,workflow_restrictions_read_only,+2more} — Update a self-hosted runner group for an organization
DELETE /orgs/{org}/actions/runner-groups/{runner_group_id} -> ? — Delete a self-hosted runner group from an organization
GET /orgs/{org}/actions/runner-groups/{runner_group_id}/hosted-runners?per_page&page -> {total_count,runners} — List GitHub-hosted runners in a group for an organization
GET /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories?page&per_page -> {total_count,repositories} — List repository access to a self-hosted runner group in an organization
PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories body:{selected_repository_ids} -> ? — Set repository access for a self-hosted runner group in an organization
PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id} -> ? — Add repository access to a self-hosted runner group in an organization
DELETE /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id} -> ? — Remove repository access to a self-hosted runner group in an organization
GET /orgs/{org}/actions/runner-groups/{runner_group_id}/runners?per_page&page -> {total_count,runners} — List self-hosted runners in a group for an organization
PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/runners body:{runners} -> ? — Set self-hosted runners in a group for an organization
PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/runners/{runner_id} -> ? — Add a self-hosted runner to a group for an organization
DELETE /orgs/{org}/actions/runner-groups/{runner_group_id}/runners/{runner_id} -> ? — Remove a self-hosted runner from a group for an organization
GET /orgs/{org}/actions/runners?name&per_page&page -> {total_count,runners} — List self-hosted runners for an organization
GET /orgs/{org}/actions/runners/downloads -> [{os,architecture,download_url,filename,temp_download_token,sha256_checksum}] — List runner applications for an organization
POST /orgs/{org}/actions/runners/generate-jitconfig body:{name,runner_group_id,labels,work_folder} -> {runner,encoded_jit_config} — Create configuration for a just-in-time runner for an organization
POST /orgs/{org}/actions/runners/registration-token -> {token,expires_at,permissions,repositories,single_file,repository_selection} — Create a registration token for an organization
POST /orgs/{org}/actions/runners/remove-token -> {token,expires_at,permissions,repositories,single_file,repository_selection} — Create a remove token for an organization
GET /orgs/{org}/actions/runners/{runner_id} -> {id,runner_group_id,name,os,status,busy,labels,ephemeral,version} — Get a self-hosted runner for an organization
DELETE /orgs/{org}/actions/runners/{runner_id} -> ? — Delete a self-hosted runner from an organization
GET /orgs/{org}/actions/runners/{runner_id}/labels -> {total_count,labels} — List labels for a self-hosted runner for an organization
POST /orgs/{org}/actions/runners/{runner_id}/labels body:{labels} -> {total_count,labels} — Add custom labels to a self-hosted runner for an organization
PUT /orgs/{org}/actions/runners/{runner_id}/labels body:{labels} -> {total_count,labels} — Set custom labels for a self-hosted runner for an organization
DELETE /orgs/{org}/actions/runners/{runner_id}/labels -> {total_count,labels} — Remove all custom labels from a self-hosted runner for an organization
DELETE /orgs/{org}/actions/runners/{runner_id}/labels/{name} -> {total_count,labels} — Remove a custom label from a self-hosted runner for an organization
GET /orgs/{org}/actions/secrets?per_page&page -> {total_count,secrets} — List organization secrets
GET /orgs/{org}/actions/secrets/public-key -> {key_id,key,id,url,title,created_at} — Get an organization public key
GET /orgs/{org}/actions/secrets/{secret_name} -> {name,created_at,updated_at,visibility,selected_repositories_url} — Get an organization secret
PUT /orgs/{org}/actions/secrets/{secret_name} body:{encrypted_value,key_id,visibility,selected_repository_ids} -> {} — Create or update an organization secret
DELETE /orgs/{org}/actions/secrets/{secret_name} -> ? — Delete an organization secret
GET /orgs/{org}/actions/secrets/{secret_name}/repositories?page&per_page -> {total_count,repositories} — List selected repositories for an organization secret
PUT /orgs/{org}/actions/secrets/{secret_name}/repositories body:{selected_repository_ids} -> ? — Set selected repositories for an organization secret
PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id} -> ? — Add selected repository to an organization secret
DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id} -> ? — Remove selected repository from an organization secret
GET /orgs/{org}/actions/variables?per_page&page -> {total_count,variables} — List organization variables
POST /orgs/{org}/actions/variables body:{name,value,visibility,selected_repository_ids} -> {} — Create an organization variable
GET /orgs/{org}/actions/variables/{name} -> {name,value,created_at,updated_at,visibility,selected_repositories_url} — Get an organization variable
PATCH /orgs/{org}/actions/variables/{name} body:{name,value,visibility,selected_repository_ids} -> ? — Update an organization variable
DELETE /orgs/{org}/actions/variables/{name} -> ? — Delete an organization variable
GET /orgs/{org}/actions/variables/{name}/repositories?page&per_page -> {total_count,repositories} — List selected repositories for an organization variable
PUT /orgs/{org}/actions/variables/{name}/repositories body:{selected_repository_ids} -> ? — Set selected repositories for an organization variable
PUT /orgs/{org}/actions/variables/{name}/repositories/{repository_id} -> ? — Add selected repository to an organization variable
DELETE /orgs/{org}/actions/variables/{name}/repositories/{repository_id} -> ? — Remove selected repository from an organization variable
GET /repos/{owner}/{repo}/actions/artifacts?per_page&page&name -> {total_count,artifacts} — List artifacts for a repository
GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id} -> {id,node_id,name,size_in_bytes,url,archive_download_url,expired,created_at,expires_at,updated_at,digest,workflow_run} — Get an artifact
DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id} -> ? — Delete an artifact
GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format} -> ? — Download an artifact
GET /repos/{owner}/{repo}/actions/cache/retention-limit -> {max_cache_retention_days} — Get GitHub Actions cache retention limit for a repository
PUT /repos/{owner}/{repo}/actions/cache/retention-limit body:{max_cache_retention_days} -> ? — Set GitHub Actions cache retention limit for a repository
GET /repos/{owner}/{repo}/actions/cache/storage-limit -> {max_cache_size_gb} — Get GitHub Actions cache storage limit for a repository
PUT /repos/{owner}/{repo}/actions/cache/storage-limit body:{max_cache_size_gb} -> ? — Set GitHub Actions cache storage limit for a repository
GET /repos/{owner}/{repo}/actions/cache/usage -> {full_name,active_caches_size_in_bytes,active_caches_count} — Get GitHub Actions cache usage for a repository
GET /repos/{owner}/{repo}/actions/caches?per_page&page&ref&key&sort&direction -> {total_count,actions_caches} — List GitHub Actions caches for a repository
DELETE /repos/{owner}/{repo}/actions/caches?key*&ref -> {total_count,actions_caches} — Delete GitHub Actions caches for a repository (using a cache key)
DELETE /repos/{owner}/{repo}/actions/caches/{cache_id} -> ? — Delete a GitHub Actions cache for a repository (using a cache ID)
GET /repos/{owner}/{repo}/actions/concurrency_groups?per_page&after -> {total_count,concurrency_groups} — List concurrency groups for a repository
GET /repos/{owner}/{repo}/actions/concurrency_groups/{concurrency_group_name}?ahead_of_run&ahead_of_job -> {group_name,group_url,total_count,group_members} — Get a concurrency group for a repository
GET /repos/{owner}/{repo}/actions/jobs/{job_id} -> {id,run_id,run_url,run_attempt,node_id,head_sha,url,html_url,status,conclusion,created_at,started_at,+11more} — Get a job for a workflow run
GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs -> ? — Download job logs for a workflow run
POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun body:{enable_debug_logging,enable_debugger} -> {} — Re-run a job from a workflow run
GET /repos/{owner}/{repo}/actions/oidc/customization/sub -> {use_default,include_claim_keys,use_immutable_subject,sub_claim_prefix} — Get the customization template for an OIDC subject claim for a repository
PUT /repos/{owner}/{repo}/actions/oidc/customization/sub body:{use_default,include_claim_keys,use_immutable_subject} -> {} — Set the customization template for an OIDC subject claim for a repository
GET /repos/{owner}/{repo}/actions/organization-secrets?per_page&page -> {total_count,secrets} — List repository organization secrets
GET /repos/{owner}/{repo}/actions/organization-variables?per_page&page -> {total_count,variables} — List repository organization variables
GET /repos/{owner}/{repo}/actions/permissions -> {enabled,allowed_actions,selected_actions_url,sha_pinning_required} — Get GitHub Actions permissions for a repository
PUT /repos/{owner}/{repo}/actions/permissions body:{enabled,allowed_actions,sha_pinning_required} -> ? — Set GitHub Actions permissions for a repository
GET /repos/{owner}/{repo}/actions/permissions/access -> {access_level} — Get the level of access for workflows outside of the repository
PUT /repos/{owner}/{repo}/actions/permissions/access body:{access_level} -> ? — Set the level of access for workflows outside of the repository
GET /repos/{owner}/{repo}/actions/permissions/artifact-and-log-retention -> {days,maximum_allowed_days} — Get artifact and log retention settings for a repository
PUT /repos/{owner}/{repo}/actions/permissions/artifact-and-log-retention body:{days} -> ? — Set artifact and log retention settings for a repository
GET /repos/{owner}/{repo}/actions/permissions/fork-pr-contributor-approval -> {approval_policy} — Get fork PR contributor approval permissions for a repository
PUT /repos/{owner}/{repo}/actions/permissions/fork-pr-contributor-approval body:{approval_policy} -> ? — Set fork PR contributor approval permissions for a repository
GET /repos/{owner}/{repo}/actions/permissions/fork-pr-workflows-private-repos -> {run_workflows_from_fork_pull_requests,send_write_tokens_to_workflows,send_secrets_and_variables,require_approval_for_fork_pr_workflows} — Get private repo fork PR workflow settings for a repository
PUT /repos/{owner}/{repo}/actions/permissions/fork-pr-workflows-private-repos body:{run_workflows_from_fork_pull_requests,send_write_tokens_to_workflows,send_secrets_and_variables,require_approval_for_fork_pr_workflows} -> ? — Set private repo fork PR workflow settings for a repository
GET /repos/{owner}/{repo}/actions/permissions/selected-actions -> {github_owned_allowed,verified_allowed,patterns_allowed} — Get allowed actions and reusable workflows for a repository
PUT /repos/{owner}/{repo}/actions/permissions/selected-actions body:{github_owned_allowed,verified_allowed,patterns_allowed} -> ? — Set allowed actions and reusable workflows for a repository
GET /repos/{owner}/{repo}/actions/permissions/workflow -> {default_workflow_permissions,can_approve_pull_request_reviews} — Get default workflow permissions for a repository
PUT /repos/{owner}/{repo}/actions/permissions/workflow body:{default_workflow_permissions,can_approve_pull_request_reviews} -> ? — Set default workflow permissions for a repository
GET /repos/{owner}/{repo}/actions/runners?name&per_page&page -> {total_count,runners} — List self-hosted runners for a repository
GET /repos/{owner}/{repo}/actions/runners/downloads -> [{os,architecture,download_url,filename,temp_download_token,sha256_checksum}] — List runner applications for a repository
POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig body:{name,runner_group_id,labels,work_folder} -> {runner,encoded_jit_config} — Create configuration for a just-in-time runner for a repository
POST /repos/{owner}/{repo}/actions/runners/registration-token -> {token,expires_at,permissions,repositories,single_file,repository_selection} — Create a registration token for a repository
POST /repos/{owner}/{repo}/actions/runners/remove-token -> {token,expires_at,permissions,repositories,single_file,repository_selection} — Create a remove token for a repository
GET /repos/{owner}/{repo}/actions/runners/{runner_id} -> {id,runner_group_id,name,os,status,busy,labels,ephemeral,version} — Get a self-hosted runner for a repository
DELETE /repos/{owner}/{repo}/actions/runners/{runner_id} -> ? — Delete a self-hosted runner from a repository
GET /repos/{owner}/{repo}/actions/runners/{runner_id}/labels -> {total_count,labels} — List labels for a self-hosted runner for a repository
POST /repos/{owner}/{repo}/actions/runners/{runner_id}/labels body:{labels} -> {total_count,labels} — Add custom labels to a self-hosted runner for a repository
PUT /repos/{owner}/{repo}/actions/runners/{runner_id}/labels body:{labels} -> {total_count,labels} — Set custom labels for a self-hosted runner for a repository
DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels -> {total_count,labels} — Remove all custom labels from a self-hosted runner for a repository
DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name} -> {total_count,labels} — Remove a custom label from a self-hosted runner for a repository
GET /repos/{owner}/{repo}/actions/runs?actor&branch&event&status&per_page&page&created&exclude_pull_requests&check_suite_id&head_sha -> {total_count,workflow_runs} — List workflow runs for a repository
GET /repos/{owner}/{repo}/actions/runs/{run_id}?exclude_pull_requests -> {id,name,node_id,check_suite_id,check_suite_node_id,head_branch,head_sha,path,run_number,run_attempt,referenced_workflows,event,+24more} — Get a workflow run
DELETE /repos/{owner}/{repo}/actions/runs/{run_id} -> ? — Delete a workflow run
GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals -> [{environments,state,user,comment}] — Get the review history for a workflow run
POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve -> {} — Approve a workflow run for a fork pull request
GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts?per_page&page&name&direction -> {total_count,artifacts} — List workflow run artifacts
GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}?exclude_pull_requests -> {id,name,node_id,check_suite_id,check_suite_node_id,head_branch,head_sha,path,run_number,run_attempt,referenced_workflows,event,+24more} — Get a workflow run attempt
GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs?per_page&page -> {total_count,jobs} — List jobs for a workflow run attempt
GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs -> ? — Download workflow run attempt logs
POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel -> {} — Cancel a workflow run
GET /repos/{owner}/{repo}/actions/runs/{run_id}/concurrency_groups?per_page&before&after -> {total_count,concurrency_groups} — List concurrency groups for a workflow run
POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule body:any -> ? — Review custom deployment protection rules for a workflow run
POST /repos/{owner}/{repo}/actions/runs/{run_id}/force-cancel -> {} — Force cancel a workflow run
GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs?filter&per_page&page -> {total_count,jobs} — List jobs for a workflow run
GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs -> ? — Download workflow run logs
DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs -> ? — Delete workflow run logs
GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments -> [{environment,wait_timer,wait_timer_started_at,current_user_can_approve,reviewers}] — Get pending deployments for a workflow run
POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments body:{environment_ids,state,comment} -> [{url,id,node_id,sha,ref,task,payload,original_environment,environment,description,creator,created_at,+6more}] — Review pending deployments for a workflow run
POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun body:{enable_debug_logging} -> {} — Re-run a workflow
POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs body:{enable_debug_logging} -> {} — Re-run failed jobs from a workflow run
GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing -> {billable,run_duration_ms} — Get workflow run usage
GET /repos/{owner}/{repo}/actions/secrets?per_page&page -> {total_count,secrets} — List repository secrets
GET /repos/{owner}/{repo}/actions/secrets/public-key -> {key_id,key,id,url,title,created_at} — Get a repository public key
GET /repos/{owner}/{repo}/actions/secrets/{secret_name} -> {name,created_at,updated_at} — Get a repository secret
PUT /repos/{owner}/{repo}/actions/secrets/{secret_name} body:{encrypted_value,key_id} -> {} — Create or update a repository secret
DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name} -> ? — Delete a repository secret
GET /repos/{owner}/{repo}/actions/variables?per_page&page -> {total_count,variables} — List repository variables
POST /repos/{owner}/{repo}/actions/variables body:{name,value} -> {} — Create a repository variable
GET /repos/{owner}/{repo}/actions/variables/{name} -> {name,value,created_at,updated_at} — Get a repository variable
PATCH /repos/{owner}/{repo}/actions/variables/{name} body:{name,value} -> ? — Update a repository variable
DELETE /repos/{owner}/{repo}/actions/variables/{name} -> ? — Delete a repository variable
GET /repos/{owner}/{repo}/actions/workflows?per_page&page -> {total_count,workflows} — List repository workflows
GET /repos/{owner}/{repo}/actions/workflows/{workflow_id} -> {id,node_id,name,path,state,created_at,updated_at,url,html_url,badge_url,deleted_at} — Get a workflow
PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable -> ? — Disable a workflow
POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches body:{ref,inputs,return_run_details} -> {workflow_run_id,run_url,html_url} — Create a workflow dispatch event
PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable -> ? — Enable a workflow
GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs?actor&branch&event&status&per_page&page&created&exclude_pull_requests&check_suite_id&head_sha -> {total_count,workflow_runs} — List workflow runs for a workflow
GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing -> {billable} — Get workflow usage
GET /repos/{owner}/{repo}/environments/{environment_name}/secrets?per_page&page -> {total_count,secrets} — List environment secrets
GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/public-key -> {key_id,key,id,url,title,created_at} — Get an environment public key
GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name} -> {name,created_at,updated_at} — Get an environment secret
PUT /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name} body:{encrypted_value,key_id} -> {} — Create or update an environment secret
DELETE /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name} -> ? — Delete an environment secret
GET /repos/{owner}/{repo}/environments/{environment_name}/variables?per_page&page -> {total_count,variables} — List environment variables
POST /repos/{owner}/{repo}/environments/{environment_name}/variables body:{name,value} -> {} — Create an environment variable
GET /repos/{owner}/{repo}/environments/{environment_name}/variables/{name} -> {name,value,created_at,updated_at} — Get an environment variable
PATCH /repos/{owner}/{repo}/environments/{environment_name}/variables/{name} body:{name,value} -> ? — Update an environment variable
DELETE /repos/{owner}/{repo}/environments/{environment_name}/variables/{name} -> ? — Delete an environment variable

## activity
GET /events?per_page&page -> [{id,type,actor,repo,org,payload,public,created_at}] — List public events
GET /feeds -> {timeline_url,user_url,current_user_public_url,current_user_url,current_user_actor_url,current_user_organization_url,current_user_organization_urls,security_advisories_url,repository_discussions_url,repository_discussions_category_url,_links} — Get feeds
GET /networks/{owner}/{repo}/events?per_page&page -> [{id,type,actor,repo,org,payload,public,created_at}] — List public events for a network of repositories
GET /notifications?all&participating&since&before&page&per_page -> [{id,repository,subject,reason,unread,updated_at,last_read_at,url,subscription_url}] — List notifications for the authenticated user
PUT /notifications body:{last_read_at,read} -> {message} — Mark notifications as read
GET /notifications/threads/{thread_id} -> {id,repository,subject,reason,unread,updated_at,last_read_at,url,subscription_url} — Get a thread
PATCH /notifications/threads/{thread_id} -> ? — Mark a thread as read
DELETE /notifications/threads/{thread_id} -> ? — Mark a thread as done
GET /notifications/threads/{thread_id}/subscription -> {subscribed,ignored,reason,created_at,url,thread_url,repository_url} — Get a thread subscription for the authenticated user
PUT /notifications/threads/{thread_id}/subscription body:{ignored} -> {subscribed,ignored,reason,created_at,url,thread_url,repository_url} — Set a thread subscription
DELETE /notifications/threads/{thread_id}/subscription -> ? — Delete a thread subscription
GET /orgs/{org}/events?per_page&page -> [{id,type,actor,repo,org,payload,public,created_at}] — List public organization events
GET /repos/{owner}/{repo}/events?per_page&page -> [{id,type,actor,repo,org,payload,public,created_at}] — List repository events
GET /repos/{owner}/{repo}/notifications?all&participating&since&before&per_page&page -> [{id,repository,subject,reason,unread,updated_at,last_read_at,url,subscription_url}] — List repository notifications for the authenticated user
PUT /repos/{owner}/{repo}/notifications body:{last_read_at} -> {message,url} — Mark repository notifications as read
GET /repos/{owner}/{repo}/stargazers?per_page&page -> any — List stargazers
GET /repos/{owner}/{repo}/subscribers?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List watchers
GET /repos/{owner}/{repo}/subscription -> {subscribed,ignored,reason,created_at,url,repository_url} — Get a repository subscription
PUT /repos/{owner}/{repo}/subscription body:{subscribed,ignored} -> {subscribed,ignored,reason,created_at,url,repository_url} — Set a repository subscription
DELETE /repos/{owner}/{repo}/subscription -> ? — Delete a repository subscription
GET /user/starred?sort&direction&per_page&page -> [{id,node_id,name,full_name,license,forks,permissions,owner,private,html_url,description,fork,+86more}] — List repositories starred by the authenticated user
GET /user/starred/{owner}/{repo} -> ? — Check if a repository is starred by the authenticated user
PUT /user/starred/{owner}/{repo} -> ? — Star a repository for the authenticated user
DELETE /user/starred/{owner}/{repo} -> ? — Unstar a repository for the authenticated user
GET /user/subscriptions?per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List repositories watched by the authenticated user
GET /users/{username}/events?per_page&page -> [{id,type,actor,repo,org,payload,public,created_at}] — List events for the authenticated user
GET /users/{username}/events/orgs/{org}?per_page&page -> [{id,type,actor,repo,org,payload,public,created_at}] — List organization events for the authenticated user
GET /users/{username}/events/public?per_page&page -> [{id,type,actor,repo,org,payload,public,created_at}] — List public events for a user
GET /users/{username}/received_events?per_page&page -> [{id,type,actor,repo,org,payload,public,created_at}] — List events received by the authenticated user
GET /users/{username}/received_events/public?per_page&page -> [{id,type,actor,repo,org,payload,public,created_at}] — List public events received by a user
GET /users/{username}/starred?sort&direction&per_page&page -> any — List repositories starred by a user
GET /users/{username}/subscriptions?per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List repositories watched by a user

## agent-tasks
GET /agents/repos/{owner}/{repo}/tasks?per_page&page&sort&direction&state&is_archived&since&creator_id -> {tasks,total_active_count,total_archived_count} — List tasks for repository
POST /agents/repos/{owner}/{repo}/tasks body:{prompt,model,create_pull_request,base_ref,head_ref} -> {id,url,html_url,name,creator,creator_type,user_collaborators,owner,repository,state,session_count,artifacts,+3more} — Start a task
GET /agents/repos/{owner}/{repo}/tasks/{task_id} -> {id,url,html_url,name,creator,creator_type,user_collaborators,owner,repository,state,session_count,artifacts,+4more} — Get a task by repo
GET /agents/tasks?per_page&page&sort&direction&state&is_archived&since -> {tasks,total_active_count,total_archived_count} — List tasks
GET /agents/tasks/{task_id} -> {id,url,html_url,name,creator,creator_type,user_collaborators,owner,repository,state,session_count,artifacts,+4more} — Get a task by ID

## agents
GET /orgs/{org}/agents/secrets?per_page&page -> {total_count,secrets} — List organization secrets
GET /orgs/{org}/agents/secrets/public-key -> {key_id,key,id,url,title,created_at} — Get an organization public key
GET /orgs/{org}/agents/secrets/{secret_name} -> {name,created_at,updated_at,visibility,selected_repositories_url} — Get an organization secret
PUT /orgs/{org}/agents/secrets/{secret_name} body:{encrypted_value,key_id,visibility,selected_repository_ids} -> {} — Create or update an organization secret
DELETE /orgs/{org}/agents/secrets/{secret_name} -> ? — Delete an organization secret
GET /orgs/{org}/agents/secrets/{secret_name}/repositories?page&per_page -> {total_count,repositories} — List selected repositories for an organization secret
PUT /orgs/{org}/agents/secrets/{secret_name}/repositories body:{selected_repository_ids} -> ? — Set selected repositories for an organization secret
PUT /orgs/{org}/agents/secrets/{secret_name}/repositories/{repository_id} -> ? — Add selected repository to an organization secret
DELETE /orgs/{org}/agents/secrets/{secret_name}/repositories/{repository_id} -> ? — Remove selected repository from an organization secret
GET /orgs/{org}/agents/variables?per_page&page -> {total_count,variables} — List organization variables
POST /orgs/{org}/agents/variables body:{name,value,visibility,selected_repository_ids} -> {} — Create an organization variable
GET /orgs/{org}/agents/variables/{name} -> {name,value,created_at,updated_at,visibility,selected_repositories_url} — Get an organization variable
PATCH /orgs/{org}/agents/variables/{name} body:{name,value,visibility,selected_repository_ids} -> ? — Update an organization variable
DELETE /orgs/{org}/agents/variables/{name} -> ? — Delete an organization variable
GET /orgs/{org}/agents/variables/{name}/repositories?page&per_page -> {total_count,repositories} — List selected repositories for an organization variable
PUT /orgs/{org}/agents/variables/{name}/repositories body:{selected_repository_ids} -> ? — Set selected repositories for an organization variable
PUT /orgs/{org}/agents/variables/{name}/repositories/{repository_id} -> ? — Add selected repository to an organization variable
DELETE /orgs/{org}/agents/variables/{name}/repositories/{repository_id} -> ? — Remove selected repository from an organization variable
GET /repos/{owner}/{repo}/agents/organization-secrets?per_page&page -> {total_count,secrets} — List repository organization secrets
GET /repos/{owner}/{repo}/agents/organization-variables?per_page&page -> {total_count,variables} — List repository organization variables
GET /repos/{owner}/{repo}/agents/secrets?per_page&page -> {total_count,secrets} — List repository secrets
GET /repos/{owner}/{repo}/agents/secrets/public-key -> {key_id,key,id,url,title,created_at} — Get a repository public key
GET /repos/{owner}/{repo}/agents/secrets/{secret_name} -> {name,created_at,updated_at} — Get a repository secret
PUT /repos/{owner}/{repo}/agents/secrets/{secret_name} body:{encrypted_value,key_id} -> {} — Create or update a repository secret
DELETE /repos/{owner}/{repo}/agents/secrets/{secret_name} -> ? — Delete a repository secret
GET /repos/{owner}/{repo}/agents/variables?per_page&page -> {total_count,variables} — List repository variables
POST /repos/{owner}/{repo}/agents/variables body:{name,value} -> {} — Create a repository variable
GET /repos/{owner}/{repo}/agents/variables/{name} -> {name,value,created_at,updated_at} — Get a repository variable
PATCH /repos/{owner}/{repo}/agents/variables/{name} body:{name,value} -> ? — Update a repository variable
DELETE /repos/{owner}/{repo}/agents/variables/{name} -> ? — Delete a repository variable

## apps
GET /app -> {id,slug,node_id,client_id,owner,name,description,external_url,html_url,created_at,updated_at,permissions,+2more} — Get the authenticated app
POST /app-manifests/{code}/conversions -> {id,slug,node_id,client_id,owner,name,description,external_url,html_url,created_at,updated_at,permissions,+5more} — Create a GitHub App from a manifest
GET /app/hook/config -> {url,content_type,secret,insecure_ssl} — Get a webhook configuration for an app
PATCH /app/hook/config body:{url,content_type,secret,insecure_ssl} -> {url,content_type,secret,insecure_ssl} — Update a webhook configuration for an app
GET /app/hook/deliveries?per_page&cursor&status -> [{id,guid,delivered_at,redelivery,duration,status,status_code,event,action,installation_id,repository_id,throttled_at}] — List deliveries for an app webhook
GET /app/hook/deliveries/{delivery_id} -> {id,guid,delivered_at,redelivery,duration,status,status_code,event,action,installation_id,repository_id,throttled_at,+3more} — Get a delivery for an app webhook
POST /app/hook/deliveries/{delivery_id}/attempts -> object — Redeliver a delivery for an app webhook
GET /app/installation-requests?per_page&page -> [{id,node_id,account,requester,created_at}] — List installation requests for the authenticated app
GET /app/installations?per_page&page&since&outdated -> [{id,account,repository_selection,access_tokens_url,repositories_url,html_url,app_id,client_id,target_id,target_type,permissions,events,+9more}] — List installations for the authenticated app
GET /app/installations/{installation_id} -> {id,account,repository_selection,access_tokens_url,repositories_url,html_url,app_id,client_id,target_id,target_type,permissions,events,+9more} — Get an installation for the authenticated app
DELETE /app/installations/{installation_id} -> ? — Delete an installation for the authenticated app
POST /app/installations/{installation_id}/access_tokens body:{repositories,repository_ids,permissions} -> {token,expires_at,permissions,repository_selection,repositories,single_file,has_multiple_single_files,single_file_paths} — Create an installation access token for an app
PUT /app/installations/{installation_id}/suspended -> ? — Suspend an app installation
DELETE /app/installations/{installation_id}/suspended -> ? — Unsuspend an app installation
DELETE /applications/{client_id}/grant body:{access_token} -> ? — Delete an app authorization
POST /applications/{client_id}/token body:{access_token} -> {id,url,scopes,token,token_last_eight,hashed_token,app,note,note_url,updated_at,created_at,fingerprint,+3more} — Check a token
PATCH /applications/{client_id}/token body:{access_token} -> {id,url,scopes,token,token_last_eight,hashed_token,app,note,note_url,updated_at,created_at,fingerprint,+3more} — Reset a token
DELETE /applications/{client_id}/token body:{access_token} -> ? — Delete an app token
POST /applications/{client_id}/token/scoped body:{access_token,target,target_id,repositories,repository_ids,permissions} -> {id,url,scopes,token,token_last_eight,hashed_token,app,note,note_url,updated_at,created_at,fingerprint,+3more} — Create a scoped access token
GET /apps/{app_slug} -> {id,slug,node_id,client_id,owner,name,description,external_url,html_url,created_at,updated_at,permissions,+2more} — Get an app
GET /installation/repositories?per_page&page -> {total_count,repositories,repository_selection} — List repositories accessible to the app installation
DELETE /installation/token -> ? — Revoke an installation access token
GET /marketplace_listing/accounts/{account_id} -> {url,type,id,login,organization_billing_email,email,marketplace_pending_change,marketplace_purchase} — Get a subscription plan for an account
GET /marketplace_listing/plans?per_page&page -> [{url,accounts_url,id,number,name,description,monthly_price_in_cents,yearly_price_in_cents,price_model,has_free_trial,unit_name,state,+1more}] — List plans
GET /marketplace_listing/plans/{plan_id}/accounts?sort&direction&per_page&page -> [{url,type,id,login,organization_billing_email,email,marketplace_pending_change,marketplace_purchase}] — List accounts for a plan
GET /marketplace_listing/stubbed/accounts/{account_id} -> {url,type,id,login,organization_billing_email,email,marketplace_pending_change,marketplace_purchase} — Get a subscription plan for an account (stubbed)
GET /marketplace_listing/stubbed/plans?per_page&page -> [{url,accounts_url,id,number,name,description,monthly_price_in_cents,yearly_price_in_cents,price_model,has_free_trial,unit_name,state,+1more}] — List plans (stubbed)
GET /marketplace_listing/stubbed/plans/{plan_id}/accounts?sort&direction&per_page&page -> [{url,type,id,login,organization_billing_email,email,marketplace_pending_change,marketplace_purchase}] — List accounts for a plan (stubbed)
GET /orgs/{org}/installation -> {id,account,repository_selection,access_tokens_url,repositories_url,html_url,app_id,client_id,target_id,target_type,permissions,events,+9more} — Get an organization installation for the authenticated app
GET /repos/{owner}/{repo}/installation -> {id,account,repository_selection,access_tokens_url,repositories_url,html_url,app_id,client_id,target_id,target_type,permissions,events,+9more} — Get a repository installation for the authenticated app
GET /user/installations?per_page&page -> {total_count,installations} — List app installations accessible to the user access token
GET /user/installations/{installation_id}/repositories?per_page&page -> {total_count,repository_selection,repositories} — List repositories accessible to the user access token
PUT /user/installations/{installation_id}/repositories/{repository_id} -> ? — Add a repository to an app installation
DELETE /user/installations/{installation_id}/repositories/{repository_id} -> ? — Remove a repository from an app installation
GET /user/marketplace_purchases?per_page&page -> [{billing_cycle,next_billing_date,unit_count,on_free_trial,free_trial_ends_on,updated_at,account,plan}] — List subscriptions for the authenticated user
GET /user/marketplace_purchases/stubbed?per_page&page -> [{billing_cycle,next_billing_date,unit_count,on_free_trial,free_trial_ends_on,updated_at,account,plan}] — List subscriptions for the authenticated user (stubbed)
GET /users/{username}/installation -> {id,account,repository_selection,access_tokens_url,repositories_url,html_url,app_id,client_id,target_id,target_type,permissions,events,+9more} — Get a user installation for the authenticated app

## billing
GET /organizations/{org}/settings/billing/ai_credit/usage?year&month&day&user&model&product -> {timePeriod,organization,user,product,model,usageItems} — Get billing AI credit usage report for an organization
GET /organizations/{org}/settings/billing/budgets?page&per_page&scope&user -> {budgets,user,effective_budget,has_next_page,total_count} — Get all budgets for an organization
POST /organizations/{org}/settings/billing/budgets body:{budget_amount,prevent_further_usage,budget_alerting,budget_scope,budget_entity_name,budget_type,budget_product_sku,user} -> {message,budget} — Create a budget for an organization
GET /organizations/{org}/settings/billing/budgets/{budget_id} -> {id,budget_scope,budget_entity_name,user,budget_amount,prevent_further_usage,budget_product_sku,budget_type,budget_alerting} — Get a budget by ID for an organization
PATCH /organizations/{org}/settings/billing/budgets/{budget_id} body:{budget_amount,prevent_further_usage,budget_alerting,budget_scope,budget_entity_name,budget_type,budget_product_sku,user} -> {message,budget} — Update a budget for an organization
DELETE /organizations/{org}/settings/billing/budgets/{budget_id} -> {message,id} — Delete a budget for an organization
GET /organizations/{org}/settings/billing/premium_request/usage?year&month&day&user&model&product -> {timePeriod,organization,user,product,model,usageItems} — Get billing premium request usage report for an organization
GET /organizations/{org}/settings/billing/usage?year&month&day -> {usageItems} — Get billing usage report for an organization
GET /organizations/{org}/settings/billing/usage/summary?year&month&day&repository&product&sku -> {timePeriod,organization,repository,product,sku,usageItems} — Get billing usage summary for an organization
GET /users/{username}/settings/billing/ai_credit/usage?year&month&day&model&product -> {timePeriod,user,product,model,usageItems} — Get billing AI credit usage report for a user
GET /users/{username}/settings/billing/premium_request/usage?year&month&day&model&product -> {timePeriod,user,product,model,usageItems} — Get billing premium request usage report for a user
GET /users/{username}/settings/billing/usage?year&month&day -> {usageItems} — Get billing usage report for a user
GET /users/{username}/settings/billing/usage/summary?year&month&day&repository&product&sku -> {timePeriod,user,repository,product,sku,usageItems} — Get billing usage summary for a user

## campaigns
GET /orgs/{org}/campaigns?page&per_page&direction&state&sort -> [{number,created_at,updated_at,name,description,managers,team_managers,published_at,ends_at,closed_at,state,contact_link,+1more}] — List campaigns for an organization
POST /orgs/{org}/campaigns body:{name,description,managers,team_managers,ends_at,contact_link,code_scanning_alerts,generate_issues} -> {number,created_at,updated_at,name,description,managers,team_managers,published_at,ends_at,closed_at,state,contact_link,+1more} — Create a campaign for an organization
GET /orgs/{org}/campaigns/{campaign_number} -> {number,created_at,updated_at,name,description,managers,team_managers,published_at,ends_at,closed_at,state,contact_link,+1more} — Get a campaign for an organization
PATCH /orgs/{org}/campaigns/{campaign_number} body:{name,description,managers,team_managers,ends_at,contact_link,state} -> {number,created_at,updated_at,name,description,managers,team_managers,published_at,ends_at,closed_at,state,contact_link,+1more} — Update a campaign
DELETE /orgs/{org}/campaigns/{campaign_number} -> ? — Delete a campaign for an organization

## checks
POST /repos/{owner}/{repo}/check-runs body:{name,head_sha,details_url,external_id,status,started_at,conclusion,completed_at,output,actions} -> {id,head_sha,node_id,external_id,url,html_url,details_url,status,conclusion,started_at,completed_at,output,+5more} — Create a check run
GET /repos/{owner}/{repo}/check-runs/{check_run_id} -> {id,head_sha,node_id,external_id,url,html_url,details_url,status,conclusion,started_at,completed_at,output,+5more} — Get a check run
PATCH /repos/{owner}/{repo}/check-runs/{check_run_id} body:{name,details_url,external_id,started_at,status,conclusion,completed_at,output,actions} -> {id,head_sha,node_id,external_id,url,html_url,details_url,status,conclusion,started_at,completed_at,output,+5more} — Update a check run
GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations?per_page&page -> [{path,start_line,end_line,start_column,end_column,annotation_level,title,message,raw_details,blob_href}] — List check run annotations
POST /repos/{owner}/{repo}/check-runs/{check_run_id}/rerequest -> {} — Rerequest a check run
POST /repos/{owner}/{repo}/check-suites body:{head_sha} -> {id,node_id,head_branch,head_sha,status,conclusion,url,before,after,pull_requests,app,repository,+7more} — Create a check suite
PATCH /repos/{owner}/{repo}/check-suites/preferences body:{auto_trigger_checks} -> {preferences,repository} — Update repository preferences for check suites
GET /repos/{owner}/{repo}/check-suites/{check_suite_id} -> {id,node_id,head_branch,head_sha,status,conclusion,url,before,after,pull_requests,app,repository,+7more} — Get a check suite
GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs?check_name&status&filter&per_page&page -> {total_count,check_runs} — List check runs in a check suite
POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest -> {} — Rerequest a check suite
GET /repos/{owner}/{repo}/commits/{ref}/check-runs?check_name&status&filter&per_page&page&app_id -> {total_count,check_runs} — List check runs for a Git reference
GET /repos/{owner}/{repo}/commits/{ref}/check-suites?app_id&check_name&per_page&page -> {total_count,check_suites} — List check suites for a Git reference

## classroom
GET /assignments/{assignment_id} -> {id,public_repo,title,type,invite_link,invitations_enabled,slug,students_are_repo_admins,feedback_pull_requests_enabled,max_teams,max_members,editor,+7more} — Get an assignment
GET /assignments/{assignment_id}/accepted_assignments?page&per_page -> [{id,submitted,passing,commit_count,grade,students,repository,assignment}] — List accepted assignments for an assignment
GET /assignments/{assignment_id}/grades -> [{assignment_name,assignment_url,starter_code_url,github_username,roster_identifier,student_repository_name,student_repository_url,submission_timestamp,points_awarded,points_available,group_name}] — Get assignment grades
GET /classrooms?page&per_page -> [{id,name,archived,url}] — List classrooms
GET /classrooms/{classroom_id} -> {id,name,archived,organization,url} — Get a classroom
GET /classrooms/{classroom_id}/assignments?page&per_page -> [{id,public_repo,title,type,invite_link,invitations_enabled,slug,students_are_repo_admins,feedback_pull_requests_enabled,max_teams,max_members,editor,+6more}] — List assignments for a classroom

## code-quality
GET /repos/{owner}/{repo}/code-quality/findings?per_page&direction&before&after&state -> [{number,state,url,rule,location,message,created_at}] — List code quality findings for a repository
GET /repos/{owner}/{repo}/code-quality/findings/{finding_number} -> {number,state,url,rule,location,message,created_at} — Get a code quality finding
GET /repos/{owner}/{repo}/code-quality/setup -> {state,languages,runner_type,runner_label,updated_at,schedule} — Get a code quality setup configuration
PATCH /repos/{owner}/{repo}/code-quality/setup body:{state,runner_type,runner_label,languages} -> {} — Update a code quality setup configuration

## code-scanning
GET /orgs/{org}/code-scanning/alerts?tool_name&tool_guid&before&after&page&per_page&direction&state&sort&severity&assignees -> [{number,created_at,updated_at,url,html_url,instances_url,state,fixed_at,dismissed_by,dismissed_at,dismissed_reason,dismissed_comment,+6more}] — List code scanning alerts for an organization
GET /repos/{owner}/{repo}/code-scanning/alerts?tool_name&tool_guid&page&per_page&ref&pr&direction&before&after&sort&state&severity&assignees -> [{number,created_at,updated_at,url,html_url,instances_url,state,fixed_at,dismissed_by,dismissed_at,dismissed_reason,dismissed_comment,+5more}] — List code scanning alerts for a repository
GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number} -> {number,created_at,updated_at,url,html_url,instances_url,state,fixed_at,dismissed_by,dismissed_at,dismissed_reason,dismissed_comment,+5more} — Get a code scanning alert
PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number} body:{state,dismissed_reason,dismissed_comment,create_request,assignees} -> {number,created_at,updated_at,url,html_url,instances_url,state,fixed_at,dismissed_by,dismissed_at,dismissed_reason,dismissed_comment,+5more} — Update a code scanning alert
GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix -> {status,description,started_at} — Get the status of an autofix for a code scanning alert
POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix -> {status,description,started_at} — Create an autofix for a code scanning alert
POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits body:{target_ref,message} -> {target_ref,sha} — Commit an autofix for a code scanning alert
GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances?page&per_page&ref&pr -> [{ref,analysis_key,environment,category,state,commit_sha,message,location,html_url,classifications}] — List instances of a code scanning alert
GET /repos/{owner}/{repo}/code-scanning/analyses?tool_name&tool_guid&page&per_page&pr&ref&sarif_id&direction&sort -> [{ref,commit_sha,analysis_key,environment,category,error,created_at,results_count,rules_count,id,url,sarif_id,+3more}] — List code scanning analyses for a repository
GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id} -> {ref,commit_sha,analysis_key,environment,category,error,created_at,results_count,rules_count,id,url,sarif_id,+3more} — Get a code scanning analysis for a repository
DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}?confirm_delete -> {next_analysis_url,confirm_delete_url} — Delete a code scanning analysis from a repository
GET /repos/{owner}/{repo}/code-scanning/codeql/databases -> [{id,name,language,uploader,content_type,size,created_at,updated_at,url,commit_oid}] — List CodeQL databases for a repository
GET /repos/{owner}/{repo}/code-scanning/codeql/databases/{language} -> {id,name,language,uploader,content_type,size,created_at,updated_at,url,commit_oid} — Get a CodeQL database for a repository
DELETE /repos/{owner}/{repo}/code-scanning/codeql/databases/{language} -> ? — Delete a CodeQL database
POST /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses body:{language,query_pack,repositories,repository_lists,repository_owners} -> {id,controller_repo,actor,query_language,query_pack_url,created_at,updated_at,completed_at,status,actions_workflow_run_id,failure_reason,scanned_repositories,+1more} — Create a CodeQL variant analysis
GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id} -> {id,controller_repo,actor,query_language,query_pack_url,created_at,updated_at,completed_at,status,actions_workflow_run_id,failure_reason,scanned_repositories,+1more} — Get the summary of a CodeQL variant analysis
GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}/repos/{repo_owner}/{repo_name} -> {repository,analysis_status,artifact_size_in_bytes,result_count,failure_message,database_commit_sha,source_location_prefix,artifact_url} — Get the analysis status of a repository in a CodeQL variant analysis
GET /repos/{owner}/{repo}/code-scanning/default-setup -> {state,languages,runner_type,runner_label,query_suite,threat_model,updated_at,schedule} — Get a code scanning default setup configuration
PATCH /repos/{owner}/{repo}/code-scanning/default-setup body:{state,runner_type,runner_label,query_suite,threat_model,languages} -> {} — Update a code scanning default setup configuration
POST /repos/{owner}/{repo}/code-scanning/sarifs body:{commit_sha,ref,sarif,checkout_uri,started_at,tool_name,validate} -> {id,url} — Upload an analysis as SARIF data
GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id} -> {processing_status,analyses_url,errors} — Get information about a SARIF upload

## code-security
GET /enterprises/{enterprise}/code-security/configurations?per_page&before&after -> [{id,name,target_type,description,advanced_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_options,+18more}] — Get code security configurations for an enterprise
POST /enterprises/{enterprise}/code-security/configurations body:{name,description,advanced_security,code_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,code_scanning_options,code_scanning_default_setup,code_scanning_default_setup_options,+11more} -> {id,name,target_type,description,advanced_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_options,+18more} — Create a code security configuration for an enterprise
GET /enterprises/{enterprise}/code-security/configurations/defaults -> [{default_for_new_repos,configuration}] — Get default code security configurations for an enterprise
GET /enterprises/{enterprise}/code-security/configurations/{configuration_id} -> {id,name,target_type,description,advanced_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_options,+18more} — Retrieve a code security configuration of an enterprise
PATCH /enterprises/{enterprise}/code-security/configurations/{configuration_id} body:{name,description,advanced_security,code_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,code_scanning_default_setup,code_scanning_default_setup_options,code_scanning_options,+11more} -> {id,name,target_type,description,advanced_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_options,+18more} — Update a custom code security configuration for an enterprise
DELETE /enterprises/{enterprise}/code-security/configurations/{configuration_id} -> ? — Delete a code security configuration for an enterprise
POST /enterprises/{enterprise}/code-security/configurations/{configuration_id}/attach body:{scope} -> object — Attach an enterprise configuration to repositories
PUT /enterprises/{enterprise}/code-security/configurations/{configuration_id}/defaults body:{default_for_new_repos} -> {default_for_new_repos,configuration} — Set a code security configuration as a default for an enterprise
GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}/repositories?per_page&before&after&status -> [{status,repository}] — Get repositories associated with an enterprise code security configuration
GET /orgs/{org}/code-security/configurations?target_type&per_page&before&after -> [{id,name,target_type,description,advanced_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_options,+18more}] — Get code security configurations for an organization
POST /orgs/{org}/code-security/configurations body:{name,description,advanced_security,code_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_options,code_scanning_default_setup,+14more} -> {id,name,target_type,description,advanced_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_options,+18more} — Create a code security configuration
GET /orgs/{org}/code-security/configurations/defaults -> [{default_for_new_repos,configuration}] — Get default code security configurations
DELETE /orgs/{org}/code-security/configurations/detach body:{selected_repository_ids} -> ? — Detach configurations from repositories
GET /orgs/{org}/code-security/configurations/{configuration_id} -> {id,name,target_type,description,advanced_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_options,+18more} — Get a code security configuration
PATCH /orgs/{org}/code-security/configurations/{configuration_id} body:{name,description,advanced_security,code_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_default_setup,code_scanning_default_setup_options,+14more} -> {id,name,target_type,description,advanced_security,dependency_graph,dependency_graph_autosubmit_action,dependency_graph_autosubmit_action_options,dependabot_alerts,dependabot_security_updates,dependabot_delegated_alert_dismissal,code_scanning_options,+18more} — Update a code security configuration
DELETE /orgs/{org}/code-security/configurations/{configuration_id} -> ? — Delete a code security configuration
POST /orgs/{org}/code-security/configurations/{configuration_id}/attach body:{scope,selected_repository_ids} -> object — Attach a configuration to repositories
PUT /orgs/{org}/code-security/configurations/{configuration_id}/defaults body:{default_for_new_repos} -> {default_for_new_repos,configuration} — Set a code security configuration as a default for an organization
GET /orgs/{org}/code-security/configurations/{configuration_id}/repositories?per_page&before&after&status -> [{status,repository}] — Get repositories associated with a code security configuration
GET /repos/{owner}/{repo}/code-security-configuration -> {status,configuration} — Get the code security configuration associated with a repository

## codes-of-conduct
GET /codes_of_conduct -> [{key,name,url,body,html_url}] — Get all codes of conduct
GET /codes_of_conduct/{key} -> {key,name,url,body,html_url} — Get a code of conduct

## codespaces
GET /orgs/{org}/codespaces?per_page&page -> {total_count,codespaces} — List codespaces for the organization
PUT /orgs/{org}/codespaces/access body:{visibility,selected_usernames} -> ? — Manage access control for organization codespaces
POST /orgs/{org}/codespaces/access/selected_users body:{selected_usernames} -> ? — Add users to Codespaces access for an organization
DELETE /orgs/{org}/codespaces/access/selected_users body:{selected_usernames} -> ? — Remove users from Codespaces access for an organization
GET /orgs/{org}/codespaces/secrets?per_page&page -> {total_count,secrets} — List organization secrets
GET /orgs/{org}/codespaces/secrets/public-key -> {key_id,key,id,url,title,created_at} — Get an organization public key
GET /orgs/{org}/codespaces/secrets/{secret_name} -> {name,created_at,updated_at,visibility,selected_repositories_url} — Get an organization secret
PUT /orgs/{org}/codespaces/secrets/{secret_name} body:{encrypted_value,key_id,visibility,selected_repository_ids} -> {} — Create or update an organization secret
DELETE /orgs/{org}/codespaces/secrets/{secret_name} -> ? — Delete an organization secret
GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories?page&per_page -> {total_count,repositories} — List selected repositories for an organization secret
PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories body:{selected_repository_ids} -> ? — Set selected repositories for an organization secret
PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id} -> ? — Add selected repository to an organization secret
DELETE /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id} -> ? — Remove selected repository from an organization secret
GET /orgs/{org}/members/{username}/codespaces?per_page&page -> {total_count,codespaces} — List codespaces for a user in organization
DELETE /orgs/{org}/members/{username}/codespaces/{codespace_name} -> object — Delete a codespace from the organization
POST /orgs/{org}/members/{username}/codespaces/{codespace_name}/stop -> {id,name,display_name,environment_id,owner,billable_owner,repository,machine,devcontainer_path,prebuild,created_at,updated_at,+20more} — Stop a codespace for an organization user
GET /repos/{owner}/{repo}/codespaces?per_page&page -> {total_count,codespaces} — List codespaces in a repository for the authenticated user
POST /repos/{owner}/{repo}/codespaces body:{ref,location,geo,client_ip,machine,devcontainer_path,multi_repo_permissions_opt_out,working_directory,idle_timeout_minutes,display_name,retention_period_minutes} -> {id,name,display_name,environment_id,owner,billable_owner,repository,machine,devcontainer_path,prebuild,created_at,updated_at,+20more} — Create a codespace in a repository
GET /repos/{owner}/{repo}/codespaces/devcontainers?per_page&page -> {total_count,devcontainers} — List devcontainer configurations in a repository for the authenticated user
GET /repos/{owner}/{repo}/codespaces/machines?location&client_ip&ref -> {total_count,machines} — List available machine types for a repository
GET /repos/{owner}/{repo}/codespaces/new?ref&client_ip -> {billable_owner,defaults} — Get default attributes for a codespace
GET /repos/{owner}/{repo}/codespaces/permissions_check?ref*&devcontainer_path* -> {accepted} — Check if permissions defined by a devcontainer have been accepted by the authenticated user
GET /repos/{owner}/{repo}/codespaces/secrets?per_page&page -> {total_count,secrets} — List repository secrets
GET /repos/{owner}/{repo}/codespaces/secrets/public-key -> {key_id,key,id,url,title,created_at} — Get a repository public key
GET /repos/{owner}/{repo}/codespaces/secrets/{secret_name} -> {name,created_at,updated_at} — Get a repository secret
PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name} body:{encrypted_value,key_id} -> {} — Create or update a repository secret
DELETE /repos/{owner}/{repo}/codespaces/secrets/{secret_name} -> ? — Delete a repository secret
POST /repos/{owner}/{repo}/pulls/{pull_number}/codespaces body:{location,geo,client_ip,machine,devcontainer_path,multi_repo_permissions_opt_out,working_directory,idle_timeout_minutes,display_name,retention_period_minutes} -> {id,name,display_name,environment_id,owner,billable_owner,repository,machine,devcontainer_path,prebuild,created_at,updated_at,+20more} — Create a codespace from a pull request
GET /user/codespaces?per_page&page&repository_id -> {total_count,codespaces} — List codespaces for the authenticated user
POST /user/codespaces body:any -> {id,name,display_name,environment_id,owner,billable_owner,repository,machine,devcontainer_path,prebuild,created_at,updated_at,+20more} — Create a codespace for the authenticated user
GET /user/codespaces/secrets?per_page&page -> {total_count,secrets} — List secrets for the authenticated user
GET /user/codespaces/secrets/public-key -> {key_id,key} — Get public key for the authenticated user
GET /user/codespaces/secrets/{secret_name} -> {name,created_at,updated_at,visibility,selected_repositories_url} — Get a secret for the authenticated user
PUT /user/codespaces/secrets/{secret_name} body:{encrypted_value,key_id,selected_repository_ids} -> {} — Create or update a secret for the authenticated user
DELETE /user/codespaces/secrets/{secret_name} -> ? — Delete a secret for the authenticated user
GET /user/codespaces/secrets/{secret_name}/repositories -> {total_count,repositories} — List selected repositories for a user secret
PUT /user/codespaces/secrets/{secret_name}/repositories body:{selected_repository_ids} -> ? — Set selected repositories for a user secret
PUT /user/codespaces/secrets/{secret_name}/repositories/{repository_id} -> ? — Add a selected repository to a user secret
DELETE /user/codespaces/secrets/{secret_name}/repositories/{repository_id} -> ? — Remove a selected repository from a user secret
GET /user/codespaces/{codespace_name} -> {id,name,display_name,environment_id,owner,billable_owner,repository,machine,devcontainer_path,prebuild,created_at,updated_at,+20more} — Get a codespace for the authenticated user
PATCH /user/codespaces/{codespace_name} body:{machine,display_name,recent_folders} -> {id,name,display_name,environment_id,owner,billable_owner,repository,machine,devcontainer_path,prebuild,created_at,updated_at,+20more} — Update a codespace for the authenticated user
DELETE /user/codespaces/{codespace_name} -> object — Delete a codespace for the authenticated user
POST /user/codespaces/{codespace_name}/exports -> {state,completed_at,branch,sha,id,export_url,html_url} — Export a codespace for the authenticated user
GET /user/codespaces/{codespace_name}/exports/{export_id} -> {state,completed_at,branch,sha,id,export_url,html_url} — Get details about a codespace export
GET /user/codespaces/{codespace_name}/machines -> {total_count,machines} — List machine types for a codespace
POST /user/codespaces/{codespace_name}/publish body:{name,private} -> {id,name,display_name,environment_id,owner,billable_owner,repository,machine,devcontainer_path,prebuild,created_at,updated_at,+19more} — Create a repository from an unpublished codespace
POST /user/codespaces/{codespace_name}/start -> {id,name,display_name,environment_id,owner,billable_owner,repository,machine,devcontainer_path,prebuild,created_at,updated_at,+20more} — Start a codespace for the authenticated user
POST /user/codespaces/{codespace_name}/stop -> {id,name,display_name,environment_id,owner,billable_owner,repository,machine,devcontainer_path,prebuild,created_at,updated_at,+20more} — Stop a codespace for the authenticated user

## copilot
GET /enterprises/{enterprise}/copilot/metrics/reports/enterprise-1-day?day* -> {download_links,report_day} — Get Copilot enterprise usage metrics for a specific day
GET /enterprises/{enterprise}/copilot/metrics/reports/enterprise-28-day/latest -> {download_links,report_start_day,report_end_day} — Get Copilot enterprise usage metrics
GET /enterprises/{enterprise}/copilot/metrics/reports/user-teams-1-day?day* -> {download_links,report_day} — Get Copilot enterprise user-teams report for a specific day
GET /enterprises/{enterprise}/copilot/metrics/reports/users-1-day?day* -> {download_links,report_day} — Get Copilot users usage metrics for a specific day
GET /enterprises/{enterprise}/copilot/metrics/reports/users-28-day/latest -> {download_links,report_start_day,report_end_day} — Get Copilot users usage metrics
PUT /enterprises/{enterprise}/copilot/policies/coding_agent body:{policy_state} -> ? — Set the coding agent policy for an enterprise
POST /enterprises/{enterprise}/copilot/policies/coding_agent/organizations body:{organizations,custom_properties} -> ? — Add organizations to the enterprise coding agent policy
DELETE /enterprises/{enterprise}/copilot/policies/coding_agent/organizations body:{organizations,custom_properties} -> ? — Remove organizations from the enterprise coding agent policy
GET /orgs/{org}/copilot/billing -> {seat_breakdown,public_code_suggestions,ide_chat,platform_chat,cli,seat_management_setting,plan_type} — Get Copilot seat information and settings for an organization
GET /orgs/{org}/copilot/billing/seats?page&per_page -> {total_seats,seats} — List all Copilot seat assignments for an organization
POST /orgs/{org}/copilot/billing/selected_teams body:{selected_teams} -> {seats_created} — Add teams to the Copilot subscription for an organization
DELETE /orgs/{org}/copilot/billing/selected_teams body:{selected_teams} -> {seats_cancelled} — Remove teams from the Copilot subscription for an organization
POST /orgs/{org}/copilot/billing/selected_users body:{selected_usernames} -> {seats_created} — Add users to the Copilot subscription for an organization
DELETE /orgs/{org}/copilot/billing/selected_users body:{selected_usernames} -> {seats_cancelled} — Remove users from the Copilot subscription for an organization
GET /orgs/{org}/copilot/coding-agent/permissions -> {enabled_repositories,selected_repositories_url} — Get Copilot cloud agent permissions for an organization
PUT /orgs/{org}/copilot/coding-agent/permissions body:{enabled_repositories} -> ? — Set Copilot cloud agent permissions for an organization
GET /orgs/{org}/copilot/coding-agent/permissions/repositories?per_page&page -> {total_count,repositories} — List repositories enabled for Copilot cloud agent in an organization
PUT /orgs/{org}/copilot/coding-agent/permissions/repositories body:{selected_repository_ids} -> ? — Set selected repositories for Copilot cloud agent in an organization
PUT /orgs/{org}/copilot/coding-agent/permissions/repositories/{repository_id} -> ? — Enable a repository for Copilot cloud agent in an organization
DELETE /orgs/{org}/copilot/coding-agent/permissions/repositories/{repository_id} -> ? — Disable a repository for Copilot cloud agent in an organization
GET /orgs/{org}/copilot/content_exclusion -> object — Get Copilot content exclusion rules for an organization
PUT /orgs/{org}/copilot/content_exclusion body:object -> {message} — Set Copilot content exclusion rules for an organization
GET /orgs/{org}/copilot/metrics/reports/organization-1-day?day* -> {download_links,report_day} — Get Copilot organization usage metrics for a specific day
GET /orgs/{org}/copilot/metrics/reports/organization-28-day/latest -> {download_links,report_start_day,report_end_day} — Get Copilot organization usage metrics
GET /orgs/{org}/copilot/metrics/reports/user-teams-1-day?day* -> {download_links,report_day} — Get Copilot organization user-teams report for a specific day
GET /orgs/{org}/copilot/metrics/reports/users-1-day?day* -> {download_links,report_day} — Get Copilot organization users usage metrics for a specific day
GET /orgs/{org}/copilot/metrics/reports/users-28-day/latest -> {download_links,report_start_day,report_end_day} — Get Copilot organization users usage metrics
GET /orgs/{org}/members/{username}/copilot -> {assignee,organization,assigning_team,pending_cancellation_date,last_activity_at,last_activity_editor,last_authenticated_at,created_at,updated_at,plan_type} — Get Copilot seat assignment details for a user
GET /repos/{owner}/{repo}/copilot/cloud-agent/configuration -> {mcp_configuration,enabled_tools,require_actions_workflow_approval,is_firewall_enabled,is_firewall_recommended_allowlist_enabled,custom_allowlist} — Get Copilot cloud agent configuration for a repository

## copilot-spaces
GET /orgs/{org}/copilot-spaces?per_page&before&after -> {spaces} — List organization Copilot Spaces
POST /orgs/{org}/copilot-spaces body:{name,description,general_instructions,base_role,resources_attributes} -> {id,number,name,description,general_instructions,base_role,owner,creator,created_at,updated_at,html_url,api_url,+1more} — Create an organization Copilot Space
GET /orgs/{org}/copilot-spaces/{space_number} -> {id,number,name,description,general_instructions,base_role,owner,creator,created_at,updated_at,html_url,api_url,+1more} — Get an organization Copilot Space
PUT /orgs/{org}/copilot-spaces/{space_number} body:{name,description,general_instructions,base_role,resources_attributes} -> {id,number,name,description,general_instructions,base_role,owner,creator,created_at,updated_at,html_url,api_url,+1more} — Set an organization Copilot Space
DELETE /orgs/{org}/copilot-spaces/{space_number} -> ? — Delete an organization Copilot Space
GET /orgs/{org}/copilot-spaces/{space_number}/collaborators -> {collaborators} — List collaborators for an organization Copilot Space
POST /orgs/{org}/copilot-spaces/{space_number}/collaborators body:{actor_type,actor_identifier,role} -> object — Add a collaborator to an organization Copilot Space
PUT /orgs/{org}/copilot-spaces/{space_number}/collaborators/{actor_type}/{actor_identifier} body:{role} -> object — Set a collaborator role for an organization Copilot Space
DELETE /orgs/{org}/copilot-spaces/{space_number}/collaborators/{actor_type}/{actor_identifier} -> ? — Remove a collaborator from an organization Copilot Space
GET /orgs/{org}/copilot-spaces/{space_number}/resources -> {resources} — List resources for an organization Copilot Space
POST /orgs/{org}/copilot-spaces/{space_number}/resources body:{resource_type,metadata} -> {id,resource_type,copilot_chat_attachment_id,metadata,created_at,updated_at} — Create a resource for an organization Copilot Space
GET /orgs/{org}/copilot-spaces/{space_number}/resources/{space_resource_id} -> {id,resource_type,copilot_chat_attachment_id,metadata,created_at,updated_at} — Get a resource for an organization Copilot Space
PUT /orgs/{org}/copilot-spaces/{space_number}/resources/{space_resource_id} body:{metadata} -> {id,resource_type,copilot_chat_attachment_id,metadata,created_at,updated_at} — Set a resource for an organization Copilot Space
DELETE /orgs/{org}/copilot-spaces/{space_number}/resources/{space_resource_id} -> ? — Delete a resource from an organization Copilot Space
GET /users/{username}/copilot-spaces?per_page&before&after -> {spaces} — List Copilot Spaces for a user
POST /users/{username}/copilot-spaces body:{name,description,general_instructions,base_role,resources_attributes} -> {id,number,name,description,general_instructions,base_role,owner,creator,created_at,updated_at,html_url,api_url,+1more} — Create a Copilot Space for a user
GET /users/{username}/copilot-spaces/{space_number} -> {id,number,name,description,general_instructions,base_role,owner,creator,created_at,updated_at,html_url,api_url,+1more} — Get a Copilot Space for a user
PUT /users/{username}/copilot-spaces/{space_number} body:{name,description,general_instructions,base_role,resources_attributes} -> {id,number,name,description,general_instructions,base_role,owner,creator,created_at,updated_at,html_url,api_url,+1more} — Set a Copilot Space for a user
DELETE /users/{username}/copilot-spaces/{space_number} -> ? — Delete a Copilot Space for a user
GET /users/{username}/copilot-spaces/{space_number}/collaborators -> {collaborators} — List collaborators for a Copilot Space for a user
POST /users/{username}/copilot-spaces/{space_number}/collaborators body:{actor_type,actor_identifier,role} -> object — Add a collaborator to a Copilot Space for a user
PUT /users/{username}/copilot-spaces/{space_number}/collaborators/{actor_type}/{actor_identifier} body:{role} -> object — Set a collaborator role for a Copilot Space for a user
DELETE /users/{username}/copilot-spaces/{space_number}/collaborators/{actor_type}/{actor_identifier} -> ? — Remove a collaborator from a Copilot Space for a user
GET /users/{username}/copilot-spaces/{space_number}/resources -> {resources} — List resources for a Copilot Space for a user
POST /users/{username}/copilot-spaces/{space_number}/resources body:{resource_type,metadata} -> {id,resource_type,copilot_chat_attachment_id,metadata,created_at,updated_at} — Create a resource for a Copilot Space for a user
GET /users/{username}/copilot-spaces/{space_number}/resources/{space_resource_id} -> {id,resource_type,copilot_chat_attachment_id,metadata,created_at,updated_at} — Get a resource for a Copilot Space for a user
PUT /users/{username}/copilot-spaces/{space_number}/resources/{space_resource_id} body:{metadata} -> {id,resource_type,copilot_chat_attachment_id,metadata,created_at,updated_at} — Set a resource for a Copilot Space for a user
DELETE /users/{username}/copilot-spaces/{space_number}/resources/{space_resource_id} -> ? — Delete a resource from a Copilot Space for a user

## credentials
POST /credentials/revoke body:{credentials} -> object — Revoke a list of credentials

## dependabot
GET /enterprises/{enterprise}/dependabot/alerts?classification&state&severity&ecosystem&package&epss_percentage&has&assignee&scope&sort&direction&before&after&per_page -> [{number,state,dependency,security_advisory,security_vulnerability,url,html_url,created_at,updated_at,dismissed_at,dismissed_by,dismissed_reason,+6more}] — List Dependabot alerts for an enterprise
GET /enterprises/{enterprise}/dependabot/repository-access?page&per_page -> {default_level,accessible_repositories} — Lists the repositories Dependabot can access in an enterprise
PATCH /enterprises/{enterprise}/dependabot/repository-access body:{repository_ids_to_add,repository_ids_to_remove} -> ? — Updates Dependabot's repository access list for an enterprise
PUT /enterprises/{enterprise}/dependabot/repository-access/default-level body:{default_level} -> ? — Set the default repository access level for Dependabot in an enterprise
GET /orgs/{org}/dependabot/alerts?classification&state&severity&ecosystem&package&epss_percentage&artifact_registry_url&artifact_registry&has&assignee&runtime_risk&scope&sort&direction&before&after&per_page -> [{number,state,dependency,security_advisory,security_vulnerability,url,html_url,created_at,updated_at,dismissed_at,dismissed_by,dismissed_reason,+6more}] — List Dependabot alerts for an organization
GET /orgs/{org}/dependabot/repository-access?page&per_page -> {default_level,accessible_repositories} — Lists the repositories Dependabot can access in an organization
PATCH /orgs/{org}/dependabot/repository-access body:{repository_ids_to_add,repository_ids_to_remove} -> ? — Updates Dependabot's repository access list for an organization
PUT /orgs/{org}/dependabot/repository-access/default-level body:{default_level} -> ? — Set the default repository access level for Dependabot
GET /orgs/{org}/dependabot/secrets?per_page&page -> {total_count,secrets} — List organization secrets
GET /orgs/{org}/dependabot/secrets/public-key -> {key_id,key} — Get an organization public key
GET /orgs/{org}/dependabot/secrets/{secret_name} -> {name,created_at,updated_at,visibility,selected_repositories_url} — Get an organization secret
PUT /orgs/{org}/dependabot/secrets/{secret_name} body:{encrypted_value,key_id,visibility,selected_repository_ids} -> {} — Create or update an organization secret
DELETE /orgs/{org}/dependabot/secrets/{secret_name} -> ? — Delete an organization secret
GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories?page&per_page -> {total_count,repositories} — List selected repositories for an organization secret
PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories body:{selected_repository_ids} -> ? — Set selected repositories for an organization secret
PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id} -> ? — Add selected repository to an organization secret
DELETE /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id} -> ? — Remove selected repository from an organization secret
GET /repos/{owner}/{repo}/dependabot/alerts?classification&state&severity&ecosystem&package&manifest&epss_percentage&has&assignee&scope&sort&direction&before&after&per_page -> [{number,state,dependency,security_advisory,security_vulnerability,url,html_url,created_at,updated_at,dismissed_at,dismissed_by,dismissed_reason,+5more}] — List Dependabot alerts for a repository
GET /repos/{owner}/{repo}/dependabot/alerts/{alert_number} -> {number,state,dependency,security_advisory,security_vulnerability,url,html_url,created_at,updated_at,dismissed_at,dismissed_by,dismissed_reason,+5more} — Get a Dependabot alert
PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number} body:{state,dismissed_reason,dismissed_comment,assignees,agent_assignment} -> {number,state,dependency,security_advisory,security_vulnerability,url,html_url,created_at,updated_at,dismissed_at,dismissed_by,dismissed_reason,+5more} — Update a Dependabot alert
GET /repos/{owner}/{repo}/dependabot/secrets?per_page&page -> {total_count,secrets} — List repository secrets
GET /repos/{owner}/{repo}/dependabot/secrets/public-key -> {key_id,key} — Get a repository public key
GET /repos/{owner}/{repo}/dependabot/secrets/{secret_name} -> {name,created_at,updated_at} — Get a repository secret
PUT /repos/{owner}/{repo}/dependabot/secrets/{secret_name} body:{encrypted_value,key_id} -> {} — Create or update a repository secret
DELETE /repos/{owner}/{repo}/dependabot/secrets/{secret_name} -> ? — Delete a repository secret

## dependency-graph
GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}?name -> [{change_type,manifest,ecosystem,name,version,package_url,license,source_repository_url,vulnerabilities,scope}] — Get a diff of the dependencies between commits
GET /repos/{owner}/{repo}/dependency-graph/sbom -> {sbom} — Export a software bill of materials (SBOM) for a repository.
GET /repos/{owner}/{repo}/dependency-graph/sbom/fetch-report/{sbom_uuid} -> ok — Fetch a software bill of materials (SBOM) for a repository.
GET /repos/{owner}/{repo}/dependency-graph/sbom/generate-report -> {sbom_url} — Request generation of a software bill of materials (SBOM) for a repository.
POST /repos/{owner}/{repo}/dependency-graph/snapshots body:{version,job,sha,ref,detector,metadata,manifests,scanned} -> {id,created_at,result,message} — Create a snapshot of dependencies for a repository

## emojis
GET /emojis -> object — Get emojis

## enterprise-team-memberships
GET /enterprises/{enterprise}/teams/{enterprise-team}/memberships?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List members in an enterprise team
POST /enterprises/{enterprise}/teams/{enterprise-team}/memberships/add body:{usernames} -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — Bulk add team members
POST /enterprises/{enterprise}/teams/{enterprise-team}/memberships/remove body:{usernames} -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — Bulk remove team members
GET /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username} -> {name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more} — Get enterprise team membership
PUT /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username} -> {name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more} — Add team member
DELETE /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username} -> ? — Remove team membership

## enterprise-team-organizations
GET /enterprises/{enterprise}/teams/{enterprise-team}/organizations?per_page&page -> [{login,id,node_id,url,repos_url,events_url,hooks_url,issues_url,members_url,public_members_url,avatar_url,description}] — Get organization assignments
POST /enterprises/{enterprise}/teams/{enterprise-team}/organizations/add body:{organization_slugs} -> [{login,id,node_id,url,repos_url,events_url,hooks_url,issues_url,members_url,public_members_url,avatar_url,description}] — Add organization assignments
POST /enterprises/{enterprise}/teams/{enterprise-team}/organizations/remove body:{organization_slugs} -> ? — Remove organization assignments
GET /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org} -> {login,id,node_id,url,repos_url,events_url,hooks_url,issues_url,members_url,public_members_url,avatar_url,description} — Get organization assignment
PUT /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org} -> {login,id,node_id,url,repos_url,events_url,hooks_url,issues_url,members_url,public_members_url,avatar_url,description} — Add an organization assignment
DELETE /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org} -> ? — Delete an organization assignment

## enterprise-teams
GET /enterprises/{enterprise}/teams?per_page&page -> [{id,name,description,slug,url,sync_to_organizations,organization_selection_type,group_id,group_name,html_url,members_url,created_at,+2more}] — List enterprise teams
POST /enterprises/{enterprise}/teams body:{name,description,sync_to_organizations,organization_selection_type,group_id,notification_setting} -> {id,name,description,slug,url,sync_to_organizations,organization_selection_type,group_id,group_name,html_url,members_url,created_at,+2more} — Create an enterprise team
GET /enterprises/{enterprise}/teams/{team_slug} -> {id,name,description,slug,url,sync_to_organizations,organization_selection_type,group_id,group_name,html_url,members_url,created_at,+2more} — Get an enterprise team
PATCH /enterprises/{enterprise}/teams/{team_slug} body:{name,description,sync_to_organizations,organization_selection_type,group_id,notification_setting} -> {id,name,description,slug,url,sync_to_organizations,organization_selection_type,group_id,group_name,html_url,members_url,created_at,+2more} — Update an enterprise team
DELETE /enterprises/{enterprise}/teams/{team_slug} -> ? — Delete an enterprise team

## gists
GET /gists?since&per_page&page -> [{url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,public,created_at,updated_at,+9more}] — List gists for the authenticated user
POST /gists body:{description,files,public} -> {forks,history,fork_of,url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,+10more} — Create a gist
GET /gists/public?since&per_page&page -> [{url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,public,created_at,updated_at,+9more}] — List public gists
GET /gists/starred?since&per_page&page -> [{url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,public,created_at,updated_at,+9more}] — List starred gists
GET /gists/{gist_id} -> {forks,history,fork_of,url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,+10more} — Get a gist
PATCH /gists/{gist_id} body:{description,files} -> {forks,history,fork_of,url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,+10more} — Update a gist
DELETE /gists/{gist_id} -> ? — Delete a gist
GET /gists/{gist_id}/comments?per_page&page -> [{id,node_id,url,body,user,created_at,updated_at,author_association}] — List gist comments
POST /gists/{gist_id}/comments body:{body} -> {id,node_id,url,body,user,created_at,updated_at,author_association} — Create a gist comment
GET /gists/{gist_id}/comments/{comment_id} -> {id,node_id,url,body,user,created_at,updated_at,author_association} — Get a gist comment
PATCH /gists/{gist_id}/comments/{comment_id} body:{body} -> {id,node_id,url,body,user,created_at,updated_at,author_association} — Update a gist comment
DELETE /gists/{gist_id}/comments/{comment_id} -> ? — Delete a gist comment
GET /gists/{gist_id}/commits?per_page&page -> [{url,version,user,change_status,committed_at}] — List gist commits
GET /gists/{gist_id}/forks?per_page&page -> [{forks,history,fork_of,url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,+10more}] — List gist forks
POST /gists/{gist_id}/forks -> {url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,public,created_at,updated_at,+9more} — Fork a gist
GET /gists/{gist_id}/star -> ? — Check if a gist is starred
PUT /gists/{gist_id}/star -> ? — Star a gist
DELETE /gists/{gist_id}/star -> ? — Unstar a gist
GET /gists/{gist_id}/{sha} -> {forks,history,fork_of,url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,+10more} — Get a gist revision
GET /users/{username}/gists?since&per_page&page -> [{url,forks_url,commits_url,id,node_id,git_pull_url,git_push_url,html_url,files,public,created_at,updated_at,+9more}] — List gists for a user

## git
POST /repos/{owner}/{repo}/git/blobs body:{content,encoding} -> {url,sha} — Create a blob
GET /repos/{owner}/{repo}/git/blobs/{file_sha} -> {content,encoding,url,sha,size,node_id,highlighted_content} — Get a blob
POST /repos/{owner}/{repo}/git/commits body:{message,tree,parents,author,committer,signature} -> {sha,node_id,url,author,committer,message,tree,parents,verification,html_url} — Create a commit
GET /repos/{owner}/{repo}/git/commits/{commit_sha} -> {sha,node_id,url,author,committer,message,tree,parents,verification,html_url} — Get a commit object
GET /repos/{owner}/{repo}/git/matching-refs/{ref} -> [{ref,node_id,url,object}] — List matching references
GET /repos/{owner}/{repo}/git/ref/{ref} -> {ref,node_id,url,object} — Get a reference
POST /repos/{owner}/{repo}/git/refs body:{ref,sha} -> {ref,node_id,url,object} — Create a reference
PATCH /repos/{owner}/{repo}/git/refs/{ref} body:{sha,force} -> {ref,node_id,url,object} — Update a reference
DELETE /repos/{owner}/{repo}/git/refs/{ref} -> ? — Delete a reference
POST /repos/{owner}/{repo}/git/tags body:{tag,message,object,type,tagger} -> {node_id,tag,sha,url,message,tagger,object,verification} — Create a tag object
GET /repos/{owner}/{repo}/git/tags/{tag_sha} -> {node_id,tag,sha,url,message,tagger,object,verification} — Get a tag
POST /repos/{owner}/{repo}/git/trees body:{tree,base_tree} -> {sha,url,truncated,tree} — Create a tree
GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive -> {sha,url,truncated,tree} — Get a tree

## gitignore
GET /gitignore/templates -> [string] — Get all gitignore templates
GET /gitignore/templates/{name} -> {name,source} — Get a gitignore template

## hosted-compute
GET /orgs/{org}/settings/network-configurations?per_page&page -> {total_count,network_configurations} — List hosted compute network configurations for an organization
POST /orgs/{org}/settings/network-configurations body:{name,compute_service,network_settings_ids,failover_network_settings_ids,failover_network_enabled} -> {id,name,compute_service,network_settings_ids,failover_network_settings_ids,failover_network_enabled,created_on} — Create a hosted compute network configuration for an organization
GET /orgs/{org}/settings/network-configurations/{network_configuration_id} -> {id,name,compute_service,network_settings_ids,failover_network_settings_ids,failover_network_enabled,created_on} — Get a hosted compute network configuration for an organization
PATCH /orgs/{org}/settings/network-configurations/{network_configuration_id} body:{name,compute_service,network_settings_ids,failover_network_settings_ids,failover_network_enabled} -> {id,name,compute_service,network_settings_ids,failover_network_settings_ids,failover_network_enabled,created_on} — Update a hosted compute network configuration for an organization
DELETE /orgs/{org}/settings/network-configurations/{network_configuration_id} -> ? — Delete a hosted compute network configuration from an organization
GET /orgs/{org}/settings/network-settings/{network_settings_id} -> {id,network_configuration_id,name,subnet_id,region} — Get a hosted compute network settings resource for an organization

## interactions
GET /orgs/{org}/interaction-limits -> any — Get interaction restrictions for an organization
PUT /orgs/{org}/interaction-limits body:{limit,expiry} -> {limit,origin,expires_at} — Set interaction restrictions for an organization
DELETE /orgs/{org}/interaction-limits -> ? — Remove interaction restrictions for an organization
GET /repos/{owner}/{repo}/interaction-limits -> any — Get interaction restrictions for a repository
PUT /repos/{owner}/{repo}/interaction-limits body:{limit,expiry} -> {limit,origin,expires_at} — Set interaction restrictions for a repository
DELETE /repos/{owner}/{repo}/interaction-limits -> ? — Remove interaction restrictions for a repository
GET /repos/{owner}/{repo}/interaction-limits/pulls/bypass-list -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — Get pull request creation cap bypass list for a repository
PUT /repos/{owner}/{repo}/interaction-limits/pulls/bypass-list body:{users} -> ? — Add users to the pull request creation cap bypass list for a repository
DELETE /repos/{owner}/{repo}/interaction-limits/pulls/bypass-list body:{users} -> ? — Remove users from the pull request creation cap bypass list for a repository
GET /repos/{owner}/{repo}/interaction-limits/pulls/creation-cap -> {enabled,max_open_pull_requests} — Get pull request creation cap for a repository
PATCH /repos/{owner}/{repo}/interaction-limits/pulls/creation-cap body:{enabled,max_open_pull_requests} -> {enabled,max_open_pull_requests} — Update pull request creation cap for a repository
GET /user/interaction-limits -> any — Get interaction restrictions for your public repositories
PUT /user/interaction-limits body:{limit,expiry} -> {limit,origin,expires_at} — Set interaction restrictions for your public repositories
DELETE /user/interaction-limits -> ? — Remove interaction restrictions from your public repositories

## issues
GET /issues?filter&state&labels&sort&direction&since&collab&orgs&owned&pulls&per_page&page -> [{id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more}] — List issues assigned to the authenticated user
GET /orgs/{org}/issues?filter&state&labels&type&sort&direction&since&per_page&page -> [{id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more}] — List organization issues assigned to the authenticated user
GET /repos/{owner}/{repo}/assignees?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List assignees
GET /repos/{owner}/{repo}/assignees/{assignee} -> ? — Check if a user can be assigned
GET /repos/{owner}/{repo}/issues?milestone&state&assignee&type&creator&mentioned&issue_field_values&labels&sort&direction&since&per_page&page -> [{id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more}] — List repository issues
POST /repos/{owner}/{repo}/issues body:{title,body,assignee,milestone,labels,assignees,issue_field_values,type} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Create an issue
GET /repos/{owner}/{repo}/issues/comments?sort&direction&since&per_page&page -> [{id,node_id,url,body,body_text,body_html,html_url,user,created_at,updated_at,issue_url,author_association,+4more}] — List issue comments for a repository
GET /repos/{owner}/{repo}/issues/comments/{comment_id} -> {id,node_id,url,body,body_text,body_html,html_url,user,created_at,updated_at,issue_url,author_association,+4more} — Get an issue comment
PATCH /repos/{owner}/{repo}/issues/comments/{comment_id} body:{body} -> {id,node_id,url,body,body_text,body_html,html_url,user,created_at,updated_at,issue_url,author_association,+4more} — Update an issue comment
DELETE /repos/{owner}/{repo}/issues/comments/{comment_id} -> ? — Delete an issue comment
PUT /repos/{owner}/{repo}/issues/comments/{comment_id}/pin -> {id,node_id,url,body,body_text,body_html,html_url,user,created_at,updated_at,issue_url,author_association,+4more} — Pin an issue comment
DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/pin -> ? — Unpin an issue comment
GET /repos/{owner}/{repo}/issues/events?per_page&page -> [{id,node_id,url,actor,event,commit_id,commit_url,created_at,issue,label,assignee,assigner,+16more}] — List issue events for a repository
GET /repos/{owner}/{repo}/issues/events/{event_id} -> {id,node_id,url,actor,event,commit_id,commit_url,created_at,issue,label,assignee,assigner,+16more} — Get an issue event
GET /repos/{owner}/{repo}/issues/{issue_number} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Get an issue
PATCH /repos/{owner}/{repo}/issues/{issue_number} body:{title,body,assignee,state,state_reason,duplicate_issue_id,milestone,labels,assignees,issue_field_values,type} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Update an issue
POST /repos/{owner}/{repo}/issues/{issue_number}/assignees body:{assignees} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Add assignees to an issue
DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees body:{assignees} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Remove assignees from an issue
GET /repos/{owner}/{repo}/issues/{issue_number}/assignees/{assignee} -> ? — Check if a user can be assigned to a issue
GET /repos/{owner}/{repo}/issues/{issue_number}/comments?since&per_page&page -> [{id,node_id,url,body,body_text,body_html,html_url,user,created_at,updated_at,issue_url,author_association,+4more}] — List issue comments
POST /repos/{owner}/{repo}/issues/{issue_number}/comments body:{body} -> {id,node_id,url,body,body_text,body_html,html_url,user,created_at,updated_at,issue_url,author_association,+4more} — Create an issue comment
GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by?per_page&page -> [{id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more}] — List dependencies an issue is blocked by
POST /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by body:{issue_id} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Add a dependency an issue is blocked by
DELETE /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by/{issue_id} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Remove dependency an issue is blocked by
GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocking?per_page&page -> [{id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more}] — List dependencies an issue is blocking
GET /repos/{owner}/{repo}/issues/{issue_number}/events?per_page&page -> [any] — List issue events
GET /repos/{owner}/{repo}/issues/{issue_number}/issue-field-values?per_page&page -> [{issue_field_id,issue_field_name,node_id,data_type,value,single_select_option,multi_select_options}] — List issue field values for an issue
POST /repos/{owner}/{repo}/issues/{issue_number}/issue-field-values body:{issue_field_values} -> [{issue_field_id,issue_field_name,node_id,data_type,value,single_select_option,multi_select_options}] — Add issue field values to an issue
PUT /repos/{owner}/{repo}/issues/{issue_number}/issue-field-values body:{issue_field_values} -> [{issue_field_id,issue_field_name,node_id,data_type,value,single_select_option,multi_select_options}] — Set issue field values for an issue
DELETE /repos/{owner}/{repo}/issues/{issue_number}/issue-field-values/{issue_field_id} -> ? — Delete an issue field value from an issue
GET /repos/{owner}/{repo}/issues/{issue_number}/labels?per_page&page -> [{id,node_id,url,name,description,color,default}] — List labels for an issue
POST /repos/{owner}/{repo}/issues/{issue_number}/labels body:any -> [{id,node_id,url,name,description,color,default}] — Add labels to an issue
PUT /repos/{owner}/{repo}/issues/{issue_number}/labels body:any -> [{id,node_id,url,name,description,color,default}] — Set labels for an issue
DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels -> ? — Remove all labels from an issue
DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name} -> [{id,node_id,url,name,description,color,default}] — Remove a label from an issue
PUT /repos/{owner}/{repo}/issues/{issue_number}/lock body:{lock_reason} -> ? — Lock an issue
DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock -> ? — Unlock an issue
GET /repos/{owner}/{repo}/issues/{issue_number}/parent -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Get parent issue
DELETE /repos/{owner}/{repo}/issues/{issue_number}/sub_issue body:{sub_issue_id} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Remove sub-issue
GET /repos/{owner}/{repo}/issues/{issue_number}/sub_issues?per_page&page -> [{id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more}] — List sub-issues
POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues body:{sub_issue_id,replace_parent} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Add sub-issue
PATCH /repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority body:{sub_issue_id,after_id,before_id} -> {id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more} — Reprioritize sub-issue
GET /repos/{owner}/{repo}/issues/{issue_number}/timeline?per_page&page -> [object] — List timeline events for an issue
GET /repos/{owner}/{repo}/labels?per_page&page -> [{id,node_id,url,name,description,color,default}] — List labels for a repository
POST /repos/{owner}/{repo}/labels body:{name,color,description} -> {id,node_id,url,name,description,color,default} — Create a label
GET /repos/{owner}/{repo}/labels/{name} -> {id,node_id,url,name,description,color,default} — Get a label
PATCH /repos/{owner}/{repo}/labels/{name} body:{new_name,color,description} -> {id,node_id,url,name,description,color,default} — Update a label
DELETE /repos/{owner}/{repo}/labels/{name} -> ? — Delete a label
GET /repos/{owner}/{repo}/milestones?state&sort&direction&per_page&page -> [{url,html_url,labels_url,id,node_id,number,state,title,description,creator,open_issues,closed_issues,+4more}] — List milestones
POST /repos/{owner}/{repo}/milestones body:{title,state,description,due_on} -> {url,html_url,labels_url,id,node_id,number,state,title,description,creator,open_issues,closed_issues,+4more} — Create a milestone
GET /repos/{owner}/{repo}/milestones/{milestone_number} -> {url,html_url,labels_url,id,node_id,number,state,title,description,creator,open_issues,closed_issues,+4more} — Get a milestone
PATCH /repos/{owner}/{repo}/milestones/{milestone_number} body:{title,state,description,due_on} -> {url,html_url,labels_url,id,node_id,number,state,title,description,creator,open_issues,closed_issues,+4more} — Update a milestone
DELETE /repos/{owner}/{repo}/milestones/{milestone_number} -> ? — Delete a milestone
GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels?per_page&page -> [{id,node_id,url,name,description,color,default}] — List labels for issues in a milestone
GET /user/issues?filter&state&labels&sort&direction&since&per_page&page -> [{id,node_id,url,repository_url,labels_url,comments_url,events_url,html_url,number,state,state_reason,title,+28more}] — List user account issues assigned to the authenticated user

## licenses
GET /licenses?featured&per_page&page -> [{key,name,url,spdx_id,node_id,html_url}] — Get all commonly used licenses
GET /licenses/{license} -> {key,name,spdx_id,url,node_id,html_url,description,implementation,permissions,conditions,limitations,body,+1more} — Get a license
GET /repos/{owner}/{repo}/license?ref -> {name,path,sha,size,url,html_url,git_url,download_url,type,content,encoding,_links,+1more} — Get the license for a repository

## markdown
POST /markdown body:{text,mode,context} -> ok — Render a Markdown document
POST /markdown/raw -> ok — Render a Markdown document in raw mode

## meta
GET / -> {current_user_url,current_user_authorizations_html_url,authorizations_url,code_search_url,commit_search_url,emails_url,emojis_url,events_url,feeds_url,followers_url,following_url,gists_url,+21more} — GitHub API Root
GET /meta -> {verifiable_password_authentication,ssh_key_fingerprints,ssh_keys,hooks,github_enterprise_importer,web,api,git,packages,pages,importer,actions,+5more} — Get GitHub meta information
GET /octocat?s -> ok — Get Octocat
GET /versions -> [string] — Get all API versions
GET /zen -> ok — Get the Zen of GitHub

## migrations
GET /orgs/{org}/migrations?per_page&page&exclude -> [{id,owner,guid,state,lock_repositories,exclude_metadata,exclude_git_data,exclude_attachments,exclude_releases,exclude_owner_projects,org_metadata_only,repositories,+6more}] — List organization migrations
POST /orgs/{org}/migrations body:{repositories,lock_repositories,exclude_metadata,exclude_git_data,exclude_attachments,exclude_releases,exclude_owner_projects,org_metadata_only,exclude} -> {id,owner,guid,state,lock_repositories,exclude_metadata,exclude_git_data,exclude_attachments,exclude_releases,exclude_owner_projects,org_metadata_only,repositories,+6more} — Start an organization migration
GET /orgs/{org}/migrations/{migration_id}?exclude -> {id,owner,guid,state,lock_repositories,exclude_metadata,exclude_git_data,exclude_attachments,exclude_releases,exclude_owner_projects,org_metadata_only,repositories,+6more} — Get an organization migration status
GET /orgs/{org}/migrations/{migration_id}/archive -> ? — Download an organization migration archive
DELETE /orgs/{org}/migrations/{migration_id}/archive -> ? — Delete an organization migration archive
DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock -> ? — Unlock an organization repository
GET /orgs/{org}/migrations/{migration_id}/repositories?per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List repositories in an organization migration
GET /repos/{owner}/{repo}/import -> {vcs,use_lfs,vcs_url,svc_root,tfvc_project,status,status_text,failed_step,error_message,import_percent,commit_count,push_percent,+11more} — Get an import status
PUT /repos/{owner}/{repo}/import body:{vcs_url,vcs,vcs_username,vcs_password,tfvc_project} -> {vcs,use_lfs,vcs_url,svc_root,tfvc_project,status,status_text,failed_step,error_message,import_percent,commit_count,push_percent,+11more} — Start an import
PATCH /repos/{owner}/{repo}/import body:{vcs_username,vcs_password,vcs,tfvc_project} -> {vcs,use_lfs,vcs_url,svc_root,tfvc_project,status,status_text,failed_step,error_message,import_percent,commit_count,push_percent,+11more} — Update an import
DELETE /repos/{owner}/{repo}/import -> ? — Cancel an import
GET /repos/{owner}/{repo}/import/authors?since -> [{id,remote_id,remote_name,email,name,url,import_url}] — Get commit authors
PATCH /repos/{owner}/{repo}/import/authors/{author_id} body:{email,name} -> {id,remote_id,remote_name,email,name,url,import_url} — Map a commit author
GET /repos/{owner}/{repo}/import/large_files -> [{ref_name,path,oid,size}] — Get large files
PATCH /repos/{owner}/{repo}/import/lfs body:{use_lfs} -> {vcs,use_lfs,vcs_url,svc_root,tfvc_project,status,status_text,failed_step,error_message,import_percent,commit_count,push_percent,+11more} — Update Git LFS preference
GET /user/migrations?per_page&page -> [{id,owner,guid,state,lock_repositories,exclude_metadata,exclude_git_data,exclude_attachments,exclude_releases,exclude_owner_projects,org_metadata_only,repositories,+6more}] — List user migrations
POST /user/migrations body:{lock_repositories,exclude_metadata,exclude_git_data,exclude_attachments,exclude_releases,exclude_owner_projects,org_metadata_only,exclude,repositories} -> {id,owner,guid,state,lock_repositories,exclude_metadata,exclude_git_data,exclude_attachments,exclude_releases,exclude_owner_projects,org_metadata_only,repositories,+6more} — Start a user migration
GET /user/migrations/{migration_id}?exclude -> {id,owner,guid,state,lock_repositories,exclude_metadata,exclude_git_data,exclude_attachments,exclude_releases,exclude_owner_projects,org_metadata_only,repositories,+6more} — Get a user migration status
GET /user/migrations/{migration_id}/archive -> ? — Download a user migration archive
DELETE /user/migrations/{migration_id}/archive -> ? — Delete a user migration archive
DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock -> ? — Unlock a user repository
GET /user/migrations/{migration_id}/repositories?per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List repositories for a user migration

## oidc
GET /enterprises/{enterprise}/actions/oidc/customization/properties/repo -> [{custom_property_name,inclusion_source}] — List OIDC custom property inclusions for an enterprise
POST /enterprises/{enterprise}/actions/oidc/customization/properties/repo body:{custom_property_name} -> {custom_property_name,inclusion_source} — Create an OIDC custom property inclusion for an enterprise
DELETE /enterprises/{enterprise}/actions/oidc/customization/properties/repo/{custom_property_name} -> ? — Delete an OIDC custom property inclusion for an enterprise
GET /orgs/{org}/actions/oidc/customization/properties/repo -> [{custom_property_name,inclusion_source}] — List OIDC custom property inclusions for an organization
POST /orgs/{org}/actions/oidc/customization/properties/repo body:{custom_property_name} -> {custom_property_name,inclusion_source} — Create an OIDC custom property inclusion for an organization
DELETE /orgs/{org}/actions/oidc/customization/properties/repo/{custom_property_name} -> ? — Delete an OIDC custom property inclusion for an organization
GET /orgs/{org}/actions/oidc/customization/sub -> {include_claim_keys,use_immutable_subject} — Get the customization template for an OIDC subject claim for an organization
PUT /orgs/{org}/actions/oidc/customization/sub body:{include_claim_keys,use_immutable_subject} -> {} — Set the customization template for an OIDC subject claim for an organization

## orgs
GET /organizations?since&per_page -> [{login,id,node_id,url,repos_url,events_url,hooks_url,issues_url,members_url,public_members_url,avatar_url,description}] — List organizations
GET /orgs/{org} -> {login,id,node_id,url,repos_url,events_url,hooks_url,issues_url,members_url,public_members_url,avatar_url,description,+55more} — Get an organization
PATCH /orgs/{org} body:{billing_email,company,email,twitter_username,location,name,description,has_organization_projects,has_repository_projects,default_repository_permission,members_can_create_repositories,members_can_create_internal_repositories,+18more} -> {login,id,node_id,url,repos_url,events_url,hooks_url,issues_url,members_url,public_members_url,avatar_url,description,+55more} — Update an organization
DELETE /orgs/{org} -> object — Delete an organization
POST /orgs/{org}/artifacts/metadata/deployment-record body:{name,digest,version,status,logical_environment,physical_environment,cluster,deployment_name,tags,runtime_risks,github_repository,return_records} -> {total_count,deployment_records} — Create an artifact deployment record
POST /orgs/{org}/artifacts/metadata/deployment-record/cluster/{cluster} body:{logical_environment,physical_environment,deployments,return_records} -> {total_count,deployment_records} — Set cluster deployment records
POST /orgs/{org}/artifacts/metadata/storage-record body:{name,digest,version,artifact_url,path,registry_url,repository,status,github_repository,return_records} -> {total_count,storage_records} — Create artifact metadata storage record
GET /orgs/{org}/artifacts/{subject_digest}/metadata/deployment-records -> {total_count,deployment_records} — List artifact deployment records
GET /orgs/{org}/artifacts/{subject_digest}/metadata/storage-records -> {total_count,storage_records} — List artifact storage records
POST /orgs/{org}/attestations/bulk-list?per_page&before&after body:{subject_digests,predicate_type} -> {attestations_subject_digests,page_info} — List attestations by bulk subject digests
POST /orgs/{org}/attestations/delete-request body:object -> ok — Delete attestations in bulk
DELETE /orgs/{org}/attestations/digest/{subject_digest} -> ok — Delete attestations by subject digest
GET /orgs/{org}/attestations/repositories?per_page&before&after&predicate_type -> [{id,name}] — List attestation repositories
DELETE /orgs/{org}/attestations/{attestation_id} -> ok — Delete attestations by ID
GET /orgs/{org}/attestations/{subject_digest}?per_page&before&after&predicate_type -> {attestations} — List attestations
GET /orgs/{org}/blocks?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List users blocked by an organization
GET /orgs/{org}/blocks/{username} -> ? — Check if a user is blocked by an organization
PUT /orgs/{org}/blocks/{username} -> ? — Block a user from an organization
DELETE /orgs/{org}/blocks/{username} -> ? — Unblock a user from an organization
GET /orgs/{org}/failed_invitations?per_page&page -> [{id,login,email,role,created_at,failed_at,failed_reason,inviter,team_count,node_id,invitation_teams_url,invitation_source}] — List failed organization invitations
GET /orgs/{org}/hooks?per_page&page -> [{id,url,ping_url,deliveries_url,name,events,active,config,updated_at,created_at,type}] — List organization webhooks
POST /orgs/{org}/hooks body:{name,config,events,active} -> {id,url,ping_url,deliveries_url,name,events,active,config,updated_at,created_at,type} — Create an organization webhook
GET /orgs/{org}/hooks/{hook_id} -> {id,url,ping_url,deliveries_url,name,events,active,config,updated_at,created_at,type} — Get an organization webhook
PATCH /orgs/{org}/hooks/{hook_id} body:{config,events,active,name} -> {id,url,ping_url,deliveries_url,name,events,active,config,updated_at,created_at,type} — Update an organization webhook
DELETE /orgs/{org}/hooks/{hook_id} -> ? — Delete an organization webhook
GET /orgs/{org}/hooks/{hook_id}/config -> {url,content_type,secret,insecure_ssl} — Get a webhook configuration for an organization
PATCH /orgs/{org}/hooks/{hook_id}/config body:{url,content_type,secret,insecure_ssl} -> {url,content_type,secret,insecure_ssl} — Update a webhook configuration for an organization
GET /orgs/{org}/hooks/{hook_id}/deliveries?per_page&cursor&status -> [{id,guid,delivered_at,redelivery,duration,status,status_code,event,action,installation_id,repository_id,throttled_at}] — List deliveries for an organization webhook
GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id} -> {id,guid,delivered_at,redelivery,duration,status,status_code,event,action,installation_id,repository_id,throttled_at,+3more} — Get a webhook delivery for an organization webhook
POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts -> object — Redeliver a delivery for an organization webhook
POST /orgs/{org}/hooks/{hook_id}/pings -> ? — Ping an organization webhook
GET /orgs/{org}/insights/api/route-stats/{actor_type}/{actor_id}?min_timestamp*&max_timestamp&page&per_page&direction&sort&api_route_substring -> [{http_method,api_route,total_request_count,rate_limited_request_count,last_rate_limited_timestamp,last_request_timestamp}] — Get route stats by actor
GET /orgs/{org}/insights/api/subject-stats?min_timestamp*&max_timestamp&page&per_page&direction&sort&subject_name_substring -> [{subject_type,subject_name,subject_id,total_request_count,rate_limited_request_count,last_rate_limited_timestamp,last_request_timestamp}] — Get subject stats
GET /orgs/{org}/insights/api/summary-stats?min_timestamp*&max_timestamp -> {total_request_count,rate_limited_request_count} — Get summary stats
GET /orgs/{org}/insights/api/summary-stats/users/{user_id}?min_timestamp*&max_timestamp -> {total_request_count,rate_limited_request_count} — Get summary stats by user
GET /orgs/{org}/insights/api/summary-stats/{actor_type}/{actor_id}?min_timestamp*&max_timestamp -> {total_request_count,rate_limited_request_count} — Get summary stats by actor
GET /orgs/{org}/insights/api/time-stats?min_timestamp*&max_timestamp&timestamp_increment* -> [{timestamp,total_request_count,rate_limited_request_count}] — Get time stats
GET /orgs/{org}/insights/api/time-stats/users/{user_id}?min_timestamp*&max_timestamp&timestamp_increment* -> [{timestamp,total_request_count,rate_limited_request_count}] — Get time stats by user
GET /orgs/{org}/insights/api/time-stats/{actor_type}/{actor_id}?min_timestamp*&max_timestamp&timestamp_increment* -> [{timestamp,total_request_count,rate_limited_request_count}] — Get time stats by actor
GET /orgs/{org}/insights/api/user-stats/{user_id}?min_timestamp*&max_timestamp&page&per_page&direction&sort&actor_name_substring -> [{actor_type,actor_name,actor_id,integration_id,oauth_application_id,total_request_count,rate_limited_request_count,last_rate_limited_timestamp,last_request_timestamp}] — Get user stats
GET /orgs/{org}/installations?per_page&page -> {total_count,installations} — List app installations for an organization
GET /orgs/{org}/invitations?per_page&page&role&invitation_source -> [{id,login,email,role,created_at,failed_at,failed_reason,inviter,team_count,node_id,invitation_teams_url,invitation_source}] — List pending organization invitations
POST /orgs/{org}/invitations body:{invitee_id,email,role,team_ids} -> {id,login,email,role,created_at,failed_at,failed_reason,inviter,team_count,node_id,invitation_teams_url,invitation_source} — Create an organization invitation
DELETE /orgs/{org}/invitations/{invitation_id} -> ? — Cancel an organization invitation
GET /orgs/{org}/invitations/{invitation_id}/teams?per_page&page -> [{id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,members_url,+6more}] — List organization invitation teams
GET /orgs/{org}/issue-fields -> [{id,node_id,name,description,data_type,visibility,options,created_at,updated_at}] — List issue fields for an organization
POST /orgs/{org}/issue-fields body:{name,description,data_type,visibility,options} -> {id,node_id,name,description,data_type,visibility,options,created_at,updated_at} — Create issue field for an organization
PATCH /orgs/{org}/issue-fields/{issue_field_id} body:{name,description,visibility,options} -> {id,node_id,name,description,data_type,visibility,options,created_at,updated_at} — Update issue field for an organization
DELETE /orgs/{org}/issue-fields/{issue_field_id} -> ? — Delete issue field for an organization
GET /orgs/{org}/issue-types -> [{id,node_id,name,description,color,created_at,updated_at,is_enabled}] — List issue types for an organization
POST /orgs/{org}/issue-types body:{name,is_enabled,description,color} -> {id,node_id,name,description,color,created_at,updated_at,is_enabled} — Create issue type for an organization
PUT /orgs/{org}/issue-types/{issue_type_id} body:{name,is_enabled,description,color} -> {id,node_id,name,description,color,created_at,updated_at,is_enabled} — Update issue type for an organization
DELETE /orgs/{org}/issue-types/{issue_type_id} -> ? — Delete issue type for an organization
GET /orgs/{org}/members?filter&role&per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List organization members
GET /orgs/{org}/members/{username} -> ? — Check organization membership for a user
DELETE /orgs/{org}/members/{username} -> ? — Remove an organization member
GET /orgs/{org}/memberships/{username} -> {url,state,role,direct_membership,enterprise_teams_providing_indirect_membership,organization_url,organization,user,permissions} — Get organization membership for a user
PUT /orgs/{org}/memberships/{username} body:{role} -> {url,state,role,direct_membership,enterprise_teams_providing_indirect_membership,organization_url,organization,user,permissions} — Set organization membership for a user
DELETE /orgs/{org}/memberships/{username} -> ? — Remove organization membership for a user
GET /orgs/{org}/organization-roles -> {total_count,roles} — Get all organization roles for an organization
DELETE /orgs/{org}/organization-roles/teams/{team_slug} -> ? — Remove all organization roles for a team
PUT /orgs/{org}/organization-roles/teams/{team_slug}/{role_id} -> ? — Assign an organization role to a team
DELETE /orgs/{org}/organization-roles/teams/{team_slug}/{role_id} -> ? — Remove an organization role from a team
DELETE /orgs/{org}/organization-roles/users/{username} -> ? — Remove all organization roles for a user
PUT /orgs/{org}/organization-roles/users/{username}/{role_id} -> ? — Assign an organization role to a user
DELETE /orgs/{org}/organization-roles/users/{username}/{role_id} -> ? — Remove an organization role from a user
GET /orgs/{org}/organization-roles/{role_id} -> {id,name,description,base_role,source,permissions,organization,created_at,updated_at} — Get an organization role
GET /orgs/{org}/organization-roles/{role_id}/teams?per_page&page -> [{assignment,id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,+6more}] — List teams that are assigned to an organization role
GET /orgs/{org}/organization-roles/{role_id}/users?per_page&page -> [{assignment,inherited_from,name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,+12more}] — List users that are assigned to an organization role
GET /orgs/{org}/outside_collaborators?filter&per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List outside collaborators for an organization
PUT /orgs/{org}/outside_collaborators/{username} body:{async} -> {} — Convert an organization member to outside collaborator
DELETE /orgs/{org}/outside_collaborators/{username} -> ? — Remove outside collaborator from an organization
GET /orgs/{org}/personal-access-token-requests?per_page&page&sort&direction&owner&repository&permission&last_used_before&last_used_after&token_id -> [{id,reason,owner,repository_selection,repositories_url,permissions,created_at,token_id,token_name,token_expired,token_expires_at,token_last_used_at}] — List requests to access organization resources with fine-grained personal access tokens
POST /orgs/{org}/personal-access-token-requests body:{pat_request_ids,action,reason} -> object — Review requests to access organization resources with fine-grained personal access tokens
POST /orgs/{org}/personal-access-token-requests/{pat_request_id} body:{action,reason} -> ? — Review a request to access organization resources with a fine-grained personal access token
GET /orgs/{org}/personal-access-token-requests/{pat_request_id}/repositories?per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List repositories requested to be accessed by a fine-grained personal access token
GET /orgs/{org}/personal-access-tokens?per_page&page&sort&direction&owner&repository&permission&last_used_before&last_used_after&token_id -> [{id,owner,repository_selection,repositories_url,permissions,access_granted_at,token_id,token_name,token_expired,token_expires_at,token_last_used_at}] — List fine-grained personal access tokens with access to organization resources
POST /orgs/{org}/personal-access-tokens body:{action,pat_ids} -> object — Update the access to organization resources via fine-grained personal access tokens
POST /orgs/{org}/personal-access-tokens/{pat_id} body:{action} -> ? — Update the access a fine-grained personal access token has to organization resources
GET /orgs/{org}/personal-access-tokens/{pat_id}/repositories?per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List repositories a fine-grained personal access token has access to
GET /orgs/{org}/properties/schema -> [{property_name,url,source_type,value_type,required,default_value,description,allowed_values,values_editable_by,require_explicit_values}] — Get all custom properties for an organization
PATCH /orgs/{org}/properties/schema body:{properties} -> [{property_name,url,source_type,value_type,required,default_value,description,allowed_values,values_editable_by,require_explicit_values}] — Create or update custom properties for an organization
GET /orgs/{org}/properties/schema/{custom_property_name} -> {property_name,url,source_type,value_type,required,default_value,description,allowed_values,values_editable_by,require_explicit_values} — Get a custom property for an organization
PUT /orgs/{org}/properties/schema/{custom_property_name} body:{value_type,required,default_value,description,allowed_values,values_editable_by,require_explicit_values} -> {property_name,url,source_type,value_type,required,default_value,description,allowed_values,values_editable_by,require_explicit_values} — Create or update a custom property for an organization
DELETE /orgs/{org}/properties/schema/{custom_property_name} -> ? — Remove a custom property for an organization
GET /orgs/{org}/properties/values?per_page&page&repository_query -> [{repository_id,repository_name,repository_full_name,properties}] — List custom property values for organization repositories
PATCH /orgs/{org}/properties/values body:{repository_names,properties} -> ? — Create or update custom property values for organization repositories
GET /orgs/{org}/public_members?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List public organization members
GET /orgs/{org}/public_members/{username} -> ? — Check public organization membership for a user
PUT /orgs/{org}/public_members/{username} -> ? — Set public organization membership for the authenticated user
DELETE /orgs/{org}/public_members/{username} -> ? — Remove public organization membership for the authenticated user
GET /orgs/{org}/rulesets/{ruleset_id}/history?per_page&page -> [{version_id,actor,updated_at}] — Get organization ruleset history
GET /orgs/{org}/rulesets/{ruleset_id}/history/{version_id} -> {version_id,actor,updated_at,state} — Get organization ruleset version
GET /orgs/{org}/security-managers -> [{id,node_id,url,members_url,name,description,permission,privacy,notification_setting,html_url,repositories_url,slug,+4more}] — List security manager teams
PUT /orgs/{org}/security-managers/teams/{team_slug} -> ? — Add a security manager team
DELETE /orgs/{org}/security-managers/teams/{team_slug} -> ? — Remove a security manager team
GET /orgs/{org}/settings/immutable-releases -> {enforced_repositories,selected_repositories_url} — Get immutable releases settings for an organization
PUT /orgs/{org}/settings/immutable-releases body:{enforced_repositories,selected_repository_ids} -> ? — Set immutable releases settings for an organization
GET /orgs/{org}/settings/immutable-releases/repositories?page&per_page -> {total_count,repositories} — List selected repositories for immutable releases enforcement
PUT /orgs/{org}/settings/immutable-releases/repositories body:{selected_repository_ids} -> ? — Set selected repositories for immutable releases enforcement
PUT /orgs/{org}/settings/immutable-releases/repositories/{repository_id} -> ? — Enable a selected repository for immutable releases in an organization
DELETE /orgs/{org}/settings/immutable-releases/repositories/{repository_id} -> ? — Disable a selected repository for immutable releases in an organization
POST /orgs/{org}/{security_product}/{enablement} body:{query_suite} -> ? — Enable or disable a security feature for an organization
GET /user/memberships/orgs?state&per_page&page -> [{url,state,role,direct_membership,enterprise_teams_providing_indirect_membership,organization_url,organization,user,permissions}] — List organization memberships for the authenticated user
GET /user/memberships/orgs/{org} -> {url,state,role,direct_membership,enterprise_teams_providing_indirect_membership,organization_url,organization,user,permissions} — Get an organization membership for the authenticated user
PATCH /user/memberships/orgs/{org} body:{state} -> {url,state,role,direct_membership,enterprise_teams_providing_indirect_membership,organization_url,organization,user,permissions} — Update an organization membership for the authenticated user
GET /user/orgs?per_page&page -> [{login,id,node_id,url,repos_url,events_url,hooks_url,issues_url,members_url,public_members_url,avatar_url,description}] — List organizations for the authenticated user
GET /users/{username}/orgs?per_page&page -> [{login,id,node_id,url,repos_url,events_url,hooks_url,issues_url,members_url,public_members_url,avatar_url,description}] — List organizations for a user

## packages
GET /orgs/{org}/docker/conflicts -> [{id,name,package_type,url,html_url,version_count,visibility,owner,repository,created_at,updated_at}] — Get list of conflicting packages during Docker migration for organization
GET /orgs/{org}/packages?package_type*&visibility&page&per_page -> [{id,name,package_type,url,html_url,version_count,visibility,owner,repository,created_at,updated_at}] — List packages for an organization
GET /orgs/{org}/packages/{package_type}/{package_name} -> {id,name,package_type,url,html_url,version_count,visibility,owner,repository,created_at,updated_at} — Get a package for an organization
DELETE /orgs/{org}/packages/{package_type}/{package_name} -> ? — Delete a package for an organization
POST /orgs/{org}/packages/{package_type}/{package_name}/restore?token -> ? — Restore a package for an organization
GET /orgs/{org}/packages/{package_type}/{package_name}/versions?page&per_page&state -> [{id,name,url,package_html_url,html_url,license,description,created_at,updated_at,deleted_at,metadata}] — List package versions for a package owned by an organization
GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id} -> {id,name,url,package_html_url,html_url,license,description,created_at,updated_at,deleted_at,metadata} — Get a package version for an organization
DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id} -> ? — Delete package version for an organization
POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore -> ? — Restore package version for an organization
GET /user/docker/conflicts -> [{id,name,package_type,url,html_url,version_count,visibility,owner,repository,created_at,updated_at}] — Get list of conflicting packages during Docker migration for authenticated-user
GET /user/packages?package_type*&visibility&page&per_page -> [{id,name,package_type,url,html_url,version_count,visibility,owner,repository,created_at,updated_at}] — List packages for the authenticated user's namespace
GET /user/packages/{package_type}/{package_name} -> {id,name,package_type,url,html_url,version_count,visibility,owner,repository,created_at,updated_at} — Get a package for the authenticated user
DELETE /user/packages/{package_type}/{package_name} -> ? — Delete a package for the authenticated user
POST /user/packages/{package_type}/{package_name}/restore?token -> ? — Restore a package for the authenticated user
GET /user/packages/{package_type}/{package_name}/versions?page&per_page&state -> [{id,name,url,package_html_url,html_url,license,description,created_at,updated_at,deleted_at,metadata}] — List package versions for a package owned by the authenticated user
GET /user/packages/{package_type}/{package_name}/versions/{package_version_id} -> {id,name,url,package_html_url,html_url,license,description,created_at,updated_at,deleted_at,metadata} — Get a package version for the authenticated user
DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id} -> ? — Delete a package version for the authenticated user
POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore -> ? — Restore a package version for the authenticated user
GET /users/{username}/docker/conflicts -> [{id,name,package_type,url,html_url,version_count,visibility,owner,repository,created_at,updated_at}] — Get list of conflicting packages during Docker migration for user
GET /users/{username}/packages?package_type*&visibility&page&per_page -> [{id,name,package_type,url,html_url,version_count,visibility,owner,repository,created_at,updated_at}] — List packages for a user
GET /users/{username}/packages/{package_type}/{package_name} -> {id,name,package_type,url,html_url,version_count,visibility,owner,repository,created_at,updated_at} — Get a package for a user
DELETE /users/{username}/packages/{package_type}/{package_name} -> ? — Delete a package for a user
POST /users/{username}/packages/{package_type}/{package_name}/restore?token -> ? — Restore a package for a user
GET /users/{username}/packages/{package_type}/{package_name}/versions -> [{id,name,url,package_html_url,html_url,license,description,created_at,updated_at,deleted_at,metadata}] — List package versions for a package owned by a user
GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id} -> {id,name,url,package_html_url,html_url,license,description,created_at,updated_at,deleted_at,metadata} — Get a package version for a user
DELETE /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id} -> ? — Delete package version for a user
POST /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore -> ? — Restore package version for a user

## private-registries
GET /orgs/{org}/private-registries?per_page&page -> {total_count,configurations} — List private registries for an organization
POST /orgs/{org}/private-registries body:{registry_type,url,username,replaces_base,encrypted_value,key_id,visibility,selected_repository_ids,auth_type,tenant_id,client_id,aws_region,+12more} -> {name,registry_type,auth_type,url,username,replaces_base,visibility,selected_repository_ids,tenant_id,client_id,aws_region,account_id,+13more} — Create a private registry for an organization
GET /orgs/{org}/private-registries/public-key -> {key_id,key} — Get private registries public key for an organization
GET /orgs/{org}/private-registries/{secret_name} -> {name,registry_type,auth_type,url,username,replaces_base,visibility,tenant_id,client_id,aws_region,account_id,role_name,+12more} — Get a private registry for an organization
PATCH /orgs/{org}/private-registries/{secret_name} body:{registry_type,url,username,replaces_base,encrypted_value,key_id,visibility,selected_repository_ids,auth_type,tenant_id,client_id,aws_region,+12more} -> ? — Update a private registry for an organization
DELETE /orgs/{org}/private-registries/{secret_name} -> ? — Delete a private registry for an organization

## projects
GET /orgs/{org}/projectsV2?q&before&after&per_page -> [{id,node_id,owner,creator,title,description,public,closed_at,created_at,updated_at,number,short_description,+5more}] — List projects for organization
GET /orgs/{org}/projectsV2/{project_number} -> {id,node_id,owner,creator,title,description,public,closed_at,created_at,updated_at,number,short_description,+5more} — Get project for organization
POST /orgs/{org}/projectsV2/{project_number}/drafts body:{title,body} -> {id,node_id,content,content_type,creator,created_at,updated_at,archived_at,project_url,item_url} — Create draft item for organization owned project
GET /orgs/{org}/projectsV2/{project_number}/fields?per_page&before&after -> [{id,issue_field_id,node_id,project_url,name,data_type,options,configuration,created_at,updated_at}] — List project fields for organization
POST /orgs/{org}/projectsV2/{project_number}/fields body:any -> {id,issue_field_id,node_id,project_url,name,data_type,options,configuration,created_at,updated_at} — Add a field to an organization-owned project.
GET /orgs/{org}/projectsV2/{project_number}/fields/{field_id} -> {id,issue_field_id,node_id,project_url,name,data_type,options,configuration,created_at,updated_at} — Get project field for organization
GET /orgs/{org}/projectsV2/{project_number}/items?q&fields&before&after&per_page -> [{id,node_id,project_url,content_type,content,creator,created_at,updated_at,archived_at,item_url,fields}] — List items for an organization owned project
POST /orgs/{org}/projectsV2/{project_number}/items body:{type,id,owner,repo,number} -> {id,node_id,content,content_type,creator,created_at,updated_at,archived_at,project_url,item_url} — Add item to organization owned project
GET /orgs/{org}/projectsV2/{project_number}/items/{item_id}?fields -> {id,node_id,project_url,content_type,content,creator,created_at,updated_at,archived_at,item_url,fields} — Get an item for an organization owned project
PATCH /orgs/{org}/projectsV2/{project_number}/items/{item_id} body:{fields} -> {id,node_id,project_url,content_type,content,creator,created_at,updated_at,archived_at,item_url,fields} — Update project item for organization
DELETE /orgs/{org}/projectsV2/{project_number}/items/{item_id} -> ? — Delete project item for organization
POST /orgs/{org}/projectsV2/{project_number}/views body:{name,layout,filter,visible_fields} -> {id,number,name,layout,node_id,project_url,html_url,creator,created_at,updated_at,filter,visible_fields,+3more} — Create a view for an organization-owned project
GET /orgs/{org}/projectsV2/{project_number}/views/{view_number}/items?fields&before&after&per_page -> [{id,node_id,project_url,content_type,content,creator,created_at,updated_at,archived_at,item_url,fields}] — List items for an organization project view
POST /user/{user_id}/projectsV2/{project_number}/drafts body:{title,body} -> {id,node_id,content,content_type,creator,created_at,updated_at,archived_at,project_url,item_url} — Create draft item for user owned project
POST /users/{user_id}/projectsV2/{project_number}/views body:{name,layout,filter,visible_fields} -> {id,number,name,layout,node_id,project_url,html_url,creator,created_at,updated_at,filter,visible_fields,+3more} — Create a view for a user-owned project
GET /users/{username}/projectsV2?q&before&after&per_page -> [{id,node_id,owner,creator,title,description,public,closed_at,created_at,updated_at,number,short_description,+5more}] — List projects for user
GET /users/{username}/projectsV2/{project_number} -> {id,node_id,owner,creator,title,description,public,closed_at,created_at,updated_at,number,short_description,+5more} — Get project for user
GET /users/{username}/projectsV2/{project_number}/fields?per_page&before&after -> [{id,issue_field_id,node_id,project_url,name,data_type,options,configuration,created_at,updated_at}] — List project fields for user
POST /users/{username}/projectsV2/{project_number}/fields body:any -> {id,issue_field_id,node_id,project_url,name,data_type,options,configuration,created_at,updated_at} — Add field to user owned project
GET /users/{username}/projectsV2/{project_number}/fields/{field_id} -> {id,issue_field_id,node_id,project_url,name,data_type,options,configuration,created_at,updated_at} — Get project field for user
GET /users/{username}/projectsV2/{project_number}/items?before&after&per_page&q&fields -> [{id,node_id,project_url,content_type,content,creator,created_at,updated_at,archived_at,item_url,fields}] — List items for a user owned project
POST /users/{username}/projectsV2/{project_number}/items body:{type,id,owner,repo,number} -> {id,node_id,content,content_type,creator,created_at,updated_at,archived_at,project_url,item_url} — Add item to user owned project
GET /users/{username}/projectsV2/{project_number}/items/{item_id}?fields -> {id,node_id,project_url,content_type,content,creator,created_at,updated_at,archived_at,item_url,fields} — Get an item for a user owned project
PATCH /users/{username}/projectsV2/{project_number}/items/{item_id} body:{fields} -> {id,node_id,project_url,content_type,content,creator,created_at,updated_at,archived_at,item_url,fields} — Update project item for user
DELETE /users/{username}/projectsV2/{project_number}/items/{item_id} -> ? — Delete project item for user
GET /users/{username}/projectsV2/{project_number}/views/{view_number}/items?fields&before&after&per_page -> [{id,node_id,project_url,content_type,content,creator,created_at,updated_at,archived_at,item_url,fields}] — List items for a user project view

## pulls
GET /repos/{owner}/{repo}/pulls?state&head&base&sort&direction&per_page&page -> [{url,id,node_id,html_url,diff_url,patch_url,issue_url,commits_url,review_comments_url,review_comment_url,comments_url,statuses_url,+24more}] — List pull requests
POST /repos/{owner}/{repo}/pulls body:{title,head,head_repo,base,body,maintainer_can_modify,draft,issue} -> {url,id,node_id,html_url,diff_url,patch_url,issue_url,commits_url,review_comments_url,review_comment_url,comments_url,statuses_url,+36more} — Create a pull request
GET /repos/{owner}/{repo}/pulls/comments?sort&direction&since&per_page&page -> [{url,pull_request_review_id,id,node_id,diff_hunk,path,position,original_position,commit_id,original_commit_id,in_reply_to_id,user,+17more}] — List review comments in a repository
GET /repos/{owner}/{repo}/pulls/comments/{comment_id} -> {url,pull_request_review_id,id,node_id,diff_hunk,path,position,original_position,commit_id,original_commit_id,in_reply_to_id,user,+17more} — Get a review comment for a pull request
PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id} body:{body} -> {url,pull_request_review_id,id,node_id,diff_hunk,path,position,original_position,commit_id,original_commit_id,in_reply_to_id,user,+17more} — Update a review comment for a pull request
DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id} -> ? — Delete a review comment for a pull request
GET /repos/{owner}/{repo}/pulls/{pull_number} -> {url,id,node_id,html_url,diff_url,patch_url,issue_url,commits_url,review_comments_url,review_comment_url,comments_url,statuses_url,+36more} — Get a pull request
PATCH /repos/{owner}/{repo}/pulls/{pull_number} body:{title,body,state,base,maintainer_can_modify} -> {url,id,node_id,html_url,diff_url,patch_url,issue_url,commits_url,review_comments_url,review_comment_url,comments_url,statuses_url,+36more} — Update a pull request
GET /repos/{owner}/{repo}/pulls/{pull_number}/comments?sort&direction&since&per_page&page -> [{url,pull_request_review_id,id,node_id,diff_hunk,path,position,original_position,commit_id,original_commit_id,in_reply_to_id,user,+17more}] — List review comments on a pull request
POST /repos/{owner}/{repo}/pulls/{pull_number}/comments body:{body,commit_id,path,position,side,line,start_line,start_side,in_reply_to,subject_type} -> {url,pull_request_review_id,id,node_id,diff_hunk,path,position,original_position,commit_id,original_commit_id,in_reply_to_id,user,+17more} — Create a review comment for a pull request
POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies body:{body} -> {url,pull_request_review_id,id,node_id,diff_hunk,path,position,original_position,commit_id,original_commit_id,in_reply_to_id,user,+17more} — Create a reply for a review comment
GET /repos/{owner}/{repo}/pulls/{pull_number}/commits?per_page&page -> [{url,sha,node_id,html_url,comments_url,commit,author,committer,parents,stats,files}] — List commits on a pull request
GET /repos/{owner}/{repo}/pulls/{pull_number}/files?per_page&page -> [{sha,filename,status,additions,deletions,changes,blob_url,raw_url,contents_url,patch,previous_filename}] — List pull requests files
GET /repos/{owner}/{repo}/pulls/{pull_number}/merge -> ? — Check if a pull request has been merged
PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge body:{commit_title,commit_message,sha,merge_method} -> {sha,merged,message} — Merge a pull request
GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers -> {users,teams} — Get all requested reviewers for a pull request
POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers body:{reviewers,team_reviewers} -> {url,id,node_id,html_url,diff_url,patch_url,issue_url,commits_url,review_comments_url,review_comment_url,comments_url,statuses_url,+24more} — Request reviewers for a pull request
DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers body:{reviewers,team_reviewers} -> {url,id,node_id,html_url,diff_url,patch_url,issue_url,commits_url,review_comments_url,review_comment_url,comments_url,statuses_url,+24more} — Remove requested reviewers from a pull request
GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews?per_page&page -> [{id,node_id,user,body,state,html_url,pull_request_url,_links,submitted_at,commit_id,body_html,body_text,+1more}] — List reviews for a pull request
POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews body:{commit_id,body,event,comments} -> {id,node_id,user,body,state,html_url,pull_request_url,_links,submitted_at,commit_id,body_html,body_text,+1more} — Create a review for a pull request
GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id} -> {id,node_id,user,body,state,html_url,pull_request_url,_links,submitted_at,commit_id,body_html,body_text,+1more} — Get a review for a pull request
PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id} body:{body} -> {id,node_id,user,body,state,html_url,pull_request_url,_links,submitted_at,commit_id,body_html,body_text,+1more} — Update a review for a pull request
DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id} -> {id,node_id,user,body,state,html_url,pull_request_url,_links,submitted_at,commit_id,body_html,body_text,+1more} — Delete a pending review for a pull request
GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments?per_page&page -> [{url,pull_request_review_id,id,node_id,diff_hunk,path,position,original_position,commit_id,original_commit_id,in_reply_to_id,user,+17more}] — List comments for a pull request review
PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals body:{message,event} -> {id,node_id,user,body,state,html_url,pull_request_url,_links,submitted_at,commit_id,body_html,body_text,+1more} — Dismiss a review for a pull request
POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events body:{body,event} -> {id,node_id,user,body,state,html_url,pull_request_url,_links,submitted_at,commit_id,body_html,body_text,+1more} — Submit a review for a pull request
PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch body:{expected_head_sha} -> {message,url} — Update a pull request branch

## rate-limit
GET /rate_limit -> {resources,rate} — Get rate limit status for the authenticated user

## reactions
GET /repos/{owner}/{repo}/comments/{comment_id}/reactions?content&per_page&page -> [{id,node_id,user,content,created_at}] — List reactions for a commit comment
POST /repos/{owner}/{repo}/comments/{comment_id}/reactions body:{content} -> {id,node_id,user,content,created_at} — Create reaction for a commit comment
DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id} -> ? — Delete a commit comment reaction
GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions?content&per_page&page -> [{id,node_id,user,content,created_at}] — List reactions for an issue comment
POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions body:{content} -> {id,node_id,user,content,created_at} — Create reaction for an issue comment
DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id} -> ? — Delete an issue comment reaction
GET /repos/{owner}/{repo}/issues/{issue_number}/reactions?content&per_page&page -> [{id,node_id,user,content,created_at}] — List reactions for an issue
POST /repos/{owner}/{repo}/issues/{issue_number}/reactions body:{content} -> {id,node_id,user,content,created_at} — Create reaction for an issue
DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id} -> ? — Delete an issue reaction
GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions?content&per_page&page -> [{id,node_id,user,content,created_at}] — List reactions for a pull request review comment
POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions body:{content} -> {id,node_id,user,content,created_at} — Create reaction for a pull request review comment
DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id} -> ? — Delete a pull request comment reaction
GET /repos/{owner}/{repo}/releases/{release_id}/reactions?content&per_page&page -> [{id,node_id,user,content,created_at}] — List reactions for a release
POST /repos/{owner}/{repo}/releases/{release_id}/reactions body:{content} -> {id,node_id,user,content,created_at} — Create reaction for a release
DELETE /repos/{owner}/{repo}/releases/{release_id}/reactions/{reaction_id} -> ? — Delete a release reaction

## repos
GET /orgs/{org}/repos?type&sort&direction&per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List organization repositories
POST /orgs/{org}/repos body:{name,description,homepage,private,visibility,has_issues,has_projects,has_wiki,has_downloads,is_template,team_id,auto_init,+13more} -> {id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+93more} — Create an organization repository
GET /orgs/{org}/rulesets?per_page&page&targets -> [{id,name,target,source_type,source,enforcement,bypass_actors,current_user_can_bypass,node_id,_links,conditions,rules,+2more}] — Get all organization repository rulesets
POST /orgs/{org}/rulesets body:{name,target,enforcement,bypass_actors,conditions,rules} -> {id,name,target,source_type,source,enforcement,bypass_actors,current_user_can_bypass,node_id,_links,conditions,rules,+2more} — Create an organization repository ruleset
GET /orgs/{org}/rulesets/rule-suites?ref&repository_name&time_period&actor_name&rule_suite_result&evaluate_status&per_page&page -> [{id,actor_id,actor_name,before_sha,after_sha,ref,repository_id,repository_name,pushed_at,result,evaluation_result}] — List organization rule suites
GET /orgs/{org}/rulesets/rule-suites/{rule_suite_id} -> {id,actor_id,actor_name,before_sha,after_sha,ref,repository_id,repository_name,pushed_at,result,evaluation_result,rule_evaluations} — Get an organization rule suite
GET /orgs/{org}/rulesets/{ruleset_id} -> {id,name,target,source_type,source,enforcement,bypass_actors,current_user_can_bypass,node_id,_links,conditions,rules,+2more} — Get an organization repository ruleset
PUT /orgs/{org}/rulesets/{ruleset_id} body:{name,target,enforcement,bypass_actors,conditions,rules} -> {id,name,target,source_type,source,enforcement,bypass_actors,current_user_can_bypass,node_id,_links,conditions,rules,+2more} — Update an organization repository ruleset
DELETE /orgs/{org}/rulesets/{ruleset_id} -> ? — Delete an organization repository ruleset
GET /repos/{owner}/{repo} -> {id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+93more} — Get a repository
PATCH /repos/{owner}/{repo} body:{name,description,homepage,private,visibility,security_and_analysis,has_issues,has_projects,has_wiki,has_pull_requests,pull_request_creation_policy,is_template,+15more} -> {id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+93more} — Update a repository
DELETE /repos/{owner}/{repo} -> ? — Delete a repository
GET /repos/{owner}/{repo}/activity?direction&per_page&before&after&ref&actor&time_period&activity_type -> [{id,node_id,before,after,ref,timestamp,activity_type,actor}] — List repository activities
POST /repos/{owner}/{repo}/attestations body:{bundle} -> {id} — Create an attestation
GET /repos/{owner}/{repo}/attestations/{subject_digest}?per_page&before&after&predicate_type -> {attestations} — List attestations
GET /repos/{owner}/{repo}/autolinks -> [{id,key_prefix,url_template,is_alphanumeric,updated_at}] — Get all autolinks of a repository
POST /repos/{owner}/{repo}/autolinks body:{key_prefix,url_template,is_alphanumeric} -> {id,key_prefix,url_template,is_alphanumeric,updated_at} — Create an autolink reference for a repository
GET /repos/{owner}/{repo}/autolinks/{autolink_id} -> {id,key_prefix,url_template,is_alphanumeric,updated_at} — Get an autolink reference of a repository
DELETE /repos/{owner}/{repo}/autolinks/{autolink_id} -> ? — Delete an autolink reference from a repository
GET /repos/{owner}/{repo}/automated-security-fixes -> {enabled,paused} — Check if Dependabot security updates are enabled for a repository
PUT /repos/{owner}/{repo}/automated-security-fixes -> ? — Enable Dependabot security updates
DELETE /repos/{owner}/{repo}/automated-security-fixes -> ? — Disable Dependabot security updates
GET /repos/{owner}/{repo}/branches?protected&per_page&page -> [{name,commit,protected,protection,protection_url}] — List branches
GET /repos/{owner}/{repo}/branches/{branch} -> {name,commit,_links,protected,protection,protection_url,pattern,required_approving_review_count} — Get a branch
GET /repos/{owner}/{repo}/branches/{branch}/protection -> {url,enabled,required_status_checks,enforce_admins,required_pull_request_reviews,restrictions,required_linear_history,allow_force_pushes,allow_deletions,block_creations,required_conversation_resolution,name,+4more} — Get branch protection
PUT /repos/{owner}/{repo}/branches/{branch}/protection body:{required_status_checks,enforce_admins,required_pull_request_reviews,restrictions,required_linear_history,allow_force_pushes,allow_deletions,block_creations,required_conversation_resolution,lock_branch,allow_fork_syncing} -> {url,required_status_checks,required_pull_request_reviews,required_signatures,enforce_admins,required_linear_history,allow_force_pushes,allow_deletions,restrictions,required_conversation_resolution,block_creations,lock_branch,+1more} — Update branch protection
DELETE /repos/{owner}/{repo}/branches/{branch}/protection -> ? — Delete branch protection
GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins -> {url,enabled} — Get admin branch protection
POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins -> {url,enabled} — Set admin branch protection
DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins -> ? — Delete admin branch protection
GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews -> {url,dismissal_restrictions,bypass_pull_request_allowances,dismiss_stale_reviews,require_code_owner_reviews,required_approving_review_count,require_last_push_approval} — Get pull request review protection
PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews body:{dismissal_restrictions,dismiss_stale_reviews,require_code_owner_reviews,required_approving_review_count,require_last_push_approval,bypass_pull_request_allowances} -> {url,dismissal_restrictions,bypass_pull_request_allowances,dismiss_stale_reviews,require_code_owner_reviews,required_approving_review_count,require_last_push_approval} — Update pull request review protection
DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews -> ? — Delete pull request review protection
GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures -> {url,enabled} — Get commit signature protection
POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures -> {url,enabled} — Create commit signature protection
DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures -> ? — Delete commit signature protection
GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks -> {url,strict,contexts,checks,contexts_url} — Get status checks protection
PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks body:{strict,contexts,checks} -> {url,strict,contexts,checks,contexts_url} — Update status check protection
DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks -> ? — Remove status check protection
GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts -> [string] — Get all status check contexts
POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts body:any -> [string] — Add status check contexts
PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts body:any -> [string] — Set status check contexts
DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts body:any -> [string] — Remove status check contexts
GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions -> {url,users_url,teams_url,apps_url,users,teams,apps} — Get access restrictions
DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions -> ? — Delete access restrictions
GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps -> [{id,slug,node_id,client_id,owner,name,description,external_url,html_url,created_at,updated_at,permissions,+2more}] — Get apps with access to the protected branch
POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps body:{apps} -> [{id,slug,node_id,client_id,owner,name,description,external_url,html_url,created_at,updated_at,permissions,+2more}] — Add app access restrictions
PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps body:{apps} -> [{id,slug,node_id,client_id,owner,name,description,external_url,html_url,created_at,updated_at,permissions,+2more}] — Set app access restrictions
DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps body:{apps} -> [{id,slug,node_id,client_id,owner,name,description,external_url,html_url,created_at,updated_at,permissions,+2more}] — Remove app access restrictions
GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams -> [{id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,members_url,+6more}] — Get teams with access to the protected branch
POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams body:any -> [{id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,members_url,+6more}] — Add team access restrictions
PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams body:any -> [{id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,members_url,+6more}] — Set team access restrictions
DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams body:any -> [{id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,members_url,+6more}] — Remove team access restrictions
GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — Get users with access to the protected branch
POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users body:{users} -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — Add user access restrictions
PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users body:{users} -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — Set user access restrictions
DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users body:{users} -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — Remove user access restrictions
POST /repos/{owner}/{repo}/branches/{branch}/rename body:{new_name} -> {name,commit,_links,protected,protection,protection_url,pattern,required_approving_review_count} — Rename a branch
GET /repos/{owner}/{repo}/codeowners/errors?ref -> {errors} — List CODEOWNERS errors
GET /repos/{owner}/{repo}/collaborators?affiliation&permission&per_page&page -> [{login,id,email,name,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+11more}] — List repository collaborators
GET /repos/{owner}/{repo}/collaborators/{username} -> ? — Check if a user is a repository collaborator
PUT /repos/{owner}/{repo}/collaborators/{username} body:{permission} -> {id,repository,invitee,inviter,permissions,created_at,expired,url,html_url,node_id} — Add a repository collaborator
DELETE /repos/{owner}/{repo}/collaborators/{username} -> ? — Remove a repository collaborator
GET /repos/{owner}/{repo}/collaborators/{username}/permission -> {permission,role_name,user} — Get repository permissions for a user
GET /repos/{owner}/{repo}/comments?per_page&page -> [{html_url,url,id,node_id,body,path,position,line,commit_id,user,created_at,updated_at,+2more}] — List commit comments for a repository
GET /repos/{owner}/{repo}/comments/{comment_id} -> {html_url,url,id,node_id,body,path,position,line,commit_id,user,created_at,updated_at,+2more} — Get a commit comment
PATCH /repos/{owner}/{repo}/comments/{comment_id} body:{body} -> {html_url,url,id,node_id,body,path,position,line,commit_id,user,created_at,updated_at,+2more} — Update a commit comment
DELETE /repos/{owner}/{repo}/comments/{comment_id} -> ? — Delete a commit comment
GET /repos/{owner}/{repo}/commits?sha&path&author&committer&since&until&per_page&page -> [{url,sha,node_id,html_url,comments_url,commit,author,committer,parents,stats,files}] — List commits
GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head -> [{name,commit,protected}] — List branches for HEAD commit
GET /repos/{owner}/{repo}/commits/{commit_sha}/comments?per_page&page -> [{html_url,url,id,node_id,body,path,position,line,commit_id,user,created_at,updated_at,+2more}] — List commit comments
POST /repos/{owner}/{repo}/commits/{commit_sha}/comments body:{body,path,position,line} -> {html_url,url,id,node_id,body,path,position,line,commit_id,user,created_at,updated_at,+2more} — Create a commit comment
GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls?per_page&page -> [{url,id,node_id,html_url,diff_url,patch_url,issue_url,commits_url,review_comments_url,review_comment_url,comments_url,statuses_url,+24more}] — List pull requests associated with a commit
GET /repos/{owner}/{repo}/commits/{ref}?page&per_page -> {url,sha,node_id,html_url,comments_url,commit,author,committer,parents,stats,files} — Get a commit
GET /repos/{owner}/{repo}/commits/{ref}/status?per_page&page -> {state,statuses,sha,total_count,repository,commit_url,url} — Get the combined status for a specific reference
GET /repos/{owner}/{repo}/commits/{ref}/statuses?per_page&page -> [{url,avatar_url,id,node_id,state,description,target_url,context,created_at,updated_at,creator}] — List commit statuses for a reference
GET /repos/{owner}/{repo}/community/profile -> {health_percentage,description,documentation,files,updated_at,content_reports_enabled} — Get community profile metrics
GET /repos/{owner}/{repo}/compare/{basehead}?page&per_page -> {url,html_url,permalink_url,diff_url,patch_url,base_commit,merge_base_commit,status,ahead_by,behind_by,total_commits,commits,+1more} — Compare two commits
GET /repos/{owner}/{repo}/contents/{path}?ref -> any — Get repository content
PUT /repos/{owner}/{repo}/contents/{path} body:{message,content,sha,branch,committer,author} -> {content,commit} — Create or update file contents
DELETE /repos/{owner}/{repo}/contents/{path} body:{message,sha,branch,committer,author} -> {content,commit} — Delete a file
GET /repos/{owner}/{repo}/contributors?anon&per_page&page -> [{login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,starred_url,subscriptions_url,+10more}] — List repository contributors
GET /repos/{owner}/{repo}/deployments?sha&ref&task&environment&per_page&page -> [{url,id,node_id,sha,ref,task,payload,original_environment,environment,description,creator,created_at,+6more}] — List deployments
POST /repos/{owner}/{repo}/deployments body:{ref,task,auto_merge,required_contexts,payload,environment,description,transient_environment,production_environment} -> {url,id,node_id,sha,ref,task,payload,original_environment,environment,description,creator,created_at,+6more} — Create a deployment
GET /repos/{owner}/{repo}/deployments/{deployment_id} -> {url,id,node_id,sha,ref,task,payload,original_environment,environment,description,creator,created_at,+6more} — Get a deployment
DELETE /repos/{owner}/{repo}/deployments/{deployment_id} -> ? — Delete a deployment
GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses?per_page&page -> [{url,id,node_id,state,creator,description,environment,target_url,created_at,updated_at,deployment_url,repository_url,+3more}] — List deployment statuses
POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses body:{state,target_url,log_url,description,environment,environment_url,auto_inactive} -> {url,id,node_id,state,creator,description,environment,target_url,created_at,updated_at,deployment_url,repository_url,+3more} — Create a deployment status
GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id} -> {url,id,node_id,state,creator,description,environment,target_url,created_at,updated_at,deployment_url,repository_url,+3more} — Get a deployment status
POST /repos/{owner}/{repo}/dispatches body:{event_type,client_payload} -> ? — Create a repository dispatch event
GET /repos/{owner}/{repo}/environments?per_page&page -> {total_count,environments} — List environments
GET /repos/{owner}/{repo}/environments/{environment_name} -> {id,node_id,name,url,html_url,created_at,updated_at,protection_rules,deployment_branch_policy} — Get an environment
PUT /repos/{owner}/{repo}/environments/{environment_name} body:{wait_timer,prevent_self_review,reviewers,deployment_branch_policy} -> {id,node_id,name,url,html_url,created_at,updated_at,protection_rules,deployment_branch_policy} — Create or update an environment
DELETE /repos/{owner}/{repo}/environments/{environment_name} -> ? — Delete an environment
GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies?per_page&page -> {total_count,branch_policies} — List deployment branch policies
POST /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies body:{name,type} -> {id,node_id,name,type} — Create a deployment branch policy
GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id} -> {id,node_id,name,type} — Get a deployment branch policy
PUT /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id} body:{name} -> {id,node_id,name,type} — Update a deployment branch policy
DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id} -> ? — Delete a deployment branch policy
GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules -> {total_count,custom_deployment_protection_rules} — Get all deployment protection rules for an environment
POST /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules body:{integration_id} -> {id,node_id,enabled,app} — Create a custom deployment protection rule on an environment
GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/apps?page&per_page -> {total_count,available_custom_deployment_protection_rule_integrations} — List custom deployment rule integrations available for an environment
GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id} -> {id,node_id,enabled,app} — Get a custom deployment protection rule
DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id} -> ? — Disable a custom protection rule for an environment
GET /repos/{owner}/{repo}/forks?sort&per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List forks
POST /repos/{owner}/{repo}/forks body:{organization,name,default_branch_only} -> {id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+93more} — Create a fork
GET /repos/{owner}/{repo}/hash-algorithm -> {hash_algorithm} — Get the hash algorithm for a repository
GET /repos/{owner}/{repo}/hooks?per_page&page -> [{type,id,name,active,events,config,updated_at,created_at,url,test_url,ping_url,deliveries_url,+1more}] — List repository webhooks
POST /repos/{owner}/{repo}/hooks body:{name,config,events,active} -> {type,id,name,active,events,config,updated_at,created_at,url,test_url,ping_url,deliveries_url,+1more} — Create a repository webhook
GET /repos/{owner}/{repo}/hooks/{hook_id} -> {type,id,name,active,events,config,updated_at,created_at,url,test_url,ping_url,deliveries_url,+1more} — Get a repository webhook
PATCH /repos/{owner}/{repo}/hooks/{hook_id} body:{config,events,add_events,remove_events,active} -> {type,id,name,active,events,config,updated_at,created_at,url,test_url,ping_url,deliveries_url,+1more} — Update a repository webhook
DELETE /repos/{owner}/{repo}/hooks/{hook_id} -> ? — Delete a repository webhook
GET /repos/{owner}/{repo}/hooks/{hook_id}/config -> {url,content_type,secret,insecure_ssl} — Get a webhook configuration for a repository
PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config body:{url,content_type,secret,insecure_ssl} -> {url,content_type,secret,insecure_ssl} — Update a webhook configuration for a repository
GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries?per_page&cursor&status -> [{id,guid,delivered_at,redelivery,duration,status,status_code,event,action,installation_id,repository_id,throttled_at}] — List deliveries for a repository webhook
GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id} -> {id,guid,delivered_at,redelivery,duration,status,status_code,event,action,installation_id,repository_id,throttled_at,+3more} — Get a delivery for a repository webhook
POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts -> object — Redeliver a delivery for a repository webhook
POST /repos/{owner}/{repo}/hooks/{hook_id}/pings -> ? — Ping a repository webhook
POST /repos/{owner}/{repo}/hooks/{hook_id}/tests -> ? — Test the push repository webhook
GET /repos/{owner}/{repo}/immutable-releases -> {enabled,enforced_by_owner} — Check if immutable releases are enabled for a repository
PUT /repos/{owner}/{repo}/immutable-releases -> ? — Enable immutable releases
DELETE /repos/{owner}/{repo}/immutable-releases -> ? — Disable immutable releases
GET /repos/{owner}/{repo}/invitations?per_page&page -> [{id,repository,invitee,inviter,permissions,created_at,expired,url,html_url,node_id}] — List repository invitations
PATCH /repos/{owner}/{repo}/invitations/{invitation_id} body:{permissions} -> {id,repository,invitee,inviter,permissions,created_at,expired,url,html_url,node_id} — Update a repository invitation
DELETE /repos/{owner}/{repo}/invitations/{invitation_id} -> ? — Delete a repository invitation
GET /repos/{owner}/{repo}/issue-types -> [{id,node_id,name,description,color,created_at,updated_at,is_enabled}] — List issue types for a repository
GET /repos/{owner}/{repo}/keys?per_page&page -> [{id,key,url,title,verified,created_at,read_only,added_by,last_used,enabled}] — List deploy keys
POST /repos/{owner}/{repo}/keys body:{title,key,read_only} -> {id,key,url,title,verified,created_at,read_only,added_by,last_used,enabled} — Create a deploy key
GET /repos/{owner}/{repo}/keys/{key_id} -> {id,key,url,title,verified,created_at,read_only,added_by,last_used,enabled} — Get a deploy key
DELETE /repos/{owner}/{repo}/keys/{key_id} -> ? — Delete a deploy key
GET /repos/{owner}/{repo}/languages -> object — List repository languages
POST /repos/{owner}/{repo}/merge-upstream body:{branch} -> {message,merge_type,base_branch} — Sync a fork branch with the upstream repository
POST /repos/{owner}/{repo}/merges body:{base,head,commit_message} -> {url,sha,node_id,html_url,comments_url,commit,author,committer,parents,stats,files} — Merge a branch
GET /repos/{owner}/{repo}/pages -> {url,status,cname,protected_domain_state,pending_domain_unverified_at,custom_404,html_url,build_type,source,public,https_certificate,https_enforced} — Get a GitHub Pages site
POST /repos/{owner}/{repo}/pages body:{build_type,source} -> {url,status,cname,protected_domain_state,pending_domain_unverified_at,custom_404,html_url,build_type,source,public,https_certificate,https_enforced} — Create a GitHub Pages site
PUT /repos/{owner}/{repo}/pages body:{cname,https_enforced,build_type,source} -> ? — Update information about a GitHub Pages site
DELETE /repos/{owner}/{repo}/pages -> ? — Delete a GitHub Pages site
GET /repos/{owner}/{repo}/pages/builds?per_page&page -> [{url,status,error,pusher,commit,duration,created_at,updated_at}] — List GitHub Pages builds
POST /repos/{owner}/{repo}/pages/builds -> {url,status} — Request a GitHub Pages build
GET /repos/{owner}/{repo}/pages/builds/latest -> {url,status,error,pusher,commit,duration,created_at,updated_at} — Get latest Pages build
GET /repos/{owner}/{repo}/pages/builds/{build_id} -> {url,status,error,pusher,commit,duration,created_at,updated_at} — Get GitHub Pages build
POST /repos/{owner}/{repo}/pages/deployments body:{artifact_id,artifact_url,environment,pages_build_version,oidc_token} -> {id,status_url,page_url,preview_url} — Create a GitHub Pages deployment
GET /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id} -> {status} — Get the status of a GitHub Pages deployment
POST /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}/cancel -> ? — Cancel a GitHub Pages deployment
GET /repos/{owner}/{repo}/pages/health -> {domain,alt_domain} — Get a DNS health check for GitHub Pages
GET /repos/{owner}/{repo}/private-vulnerability-reporting -> {enabled} — Check if private vulnerability reporting is enabled for a repository
PUT /repos/{owner}/{repo}/private-vulnerability-reporting -> ? — Enable private vulnerability reporting for a repository
DELETE /repos/{owner}/{repo}/private-vulnerability-reporting -> ? — Disable private vulnerability reporting for a repository
GET /repos/{owner}/{repo}/properties/values -> [{property_name,value}] — Get all custom property values for a repository
PATCH /repos/{owner}/{repo}/properties/values body:{properties} -> ? — Create or update custom property values for a repository
GET /repos/{owner}/{repo}/readme?ref -> {type,encoding,size,name,path,content,sha,url,git_url,html_url,download_url,_links,+2more} — Get a repository README
GET /repos/{owner}/{repo}/readme/{dir}?ref -> {type,encoding,size,name,path,content,sha,url,git_url,html_url,download_url,_links,+2more} — Get a repository README for a directory
GET /repos/{owner}/{repo}/releases?per_page&page -> [{url,html_url,assets_url,upload_url,tarball_url,zipball_url,id,node_id,tag_name,target_commitish,name,body,+13more}] — List releases
POST /repos/{owner}/{repo}/releases body:{tag_name,target_commitish,name,body,draft,prerelease,discussion_category_name,generate_release_notes,make_latest} -> {url,html_url,assets_url,upload_url,tarball_url,zipball_url,id,node_id,tag_name,target_commitish,name,body,+13more} — Create a release
GET /repos/{owner}/{repo}/releases/assets/{asset_id} -> {url,browser_download_url,id,node_id,name,label,state,content_type,size,digest,download_count,created_at,+2more} — Get a release asset
PATCH /repos/{owner}/{repo}/releases/assets/{asset_id} body:{name,label,state} -> {url,browser_download_url,id,node_id,name,label,state,content_type,size,digest,download_count,created_at,+2more} — Update a release asset
DELETE /repos/{owner}/{repo}/releases/assets/{asset_id} -> ? — Delete a release asset
POST /repos/{owner}/{repo}/releases/generate-notes body:{tag_name,target_commitish,previous_tag_name,configuration_file_path} -> {name,body} — Generate release notes content for a release
GET /repos/{owner}/{repo}/releases/latest -> {url,html_url,assets_url,upload_url,tarball_url,zipball_url,id,node_id,tag_name,target_commitish,name,body,+13more} — Get the latest release
GET /repos/{owner}/{repo}/releases/tags/{tag} -> {url,html_url,assets_url,upload_url,tarball_url,zipball_url,id,node_id,tag_name,target_commitish,name,body,+13more} — Get a release by tag name
GET /repos/{owner}/{repo}/releases/{release_id} -> {url,html_url,assets_url,upload_url,tarball_url,zipball_url,id,node_id,tag_name,target_commitish,name,body,+13more} — Get a release
PATCH /repos/{owner}/{repo}/releases/{release_id} body:{tag_name,target_commitish,name,body,draft,prerelease,make_latest,discussion_category_name} -> {url,html_url,assets_url,upload_url,tarball_url,zipball_url,id,node_id,tag_name,target_commitish,name,body,+13more} — Update a release
DELETE /repos/{owner}/{repo}/releases/{release_id} -> ? — Delete a release
GET /repos/{owner}/{repo}/releases/{release_id}/assets?per_page&page -> [{url,browser_download_url,id,node_id,name,label,state,content_type,size,digest,download_count,created_at,+2more}] — List release assets
POST /repos/{owner}/{repo}/releases/{release_id}/assets?name*&label -> {url,browser_download_url,id,node_id,name,label,state,content_type,size,digest,download_count,created_at,+2more} — Upload a release asset
GET /repos/{owner}/{repo}/rules/branches/{branch}?per_page&page -> [object] — Get rules for a branch
GET /repos/{owner}/{repo}/rulesets?per_page&page&includes_parents&targets -> [{id,name,target,source_type,source,enforcement,bypass_actors,current_user_can_bypass,node_id,_links,conditions,rules,+2more}] — Get all repository rulesets
POST /repos/{owner}/{repo}/rulesets body:{name,target,enforcement,bypass_actors,conditions,rules} -> {id,name,target,source_type,source,enforcement,bypass_actors,current_user_can_bypass,node_id,_links,conditions,rules,+2more} — Create a repository ruleset
GET /repos/{owner}/{repo}/rulesets/rule-suites?ref&time_period&actor_name&rule_suite_result&evaluate_status&per_page&page -> [{id,actor_id,actor_name,before_sha,after_sha,ref,repository_id,repository_name,pushed_at,result,evaluation_result}] — List repository rule suites
GET /repos/{owner}/{repo}/rulesets/rule-suites/{rule_suite_id} -> {id,actor_id,actor_name,before_sha,after_sha,ref,repository_id,repository_name,pushed_at,result,evaluation_result,rule_evaluations} — Get a repository rule suite
GET /repos/{owner}/{repo}/rulesets/{ruleset_id}?includes_parents -> {id,name,target,source_type,source,enforcement,bypass_actors,current_user_can_bypass,node_id,_links,conditions,rules,+2more} — Get a repository ruleset
PUT /repos/{owner}/{repo}/rulesets/{ruleset_id} body:{name,target,enforcement,bypass_actors,conditions,rules} -> {id,name,target,source_type,source,enforcement,bypass_actors,current_user_can_bypass,node_id,_links,conditions,rules,+2more} — Update a repository ruleset
DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id} -> ? — Delete a repository ruleset
GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history?per_page&page -> [{version_id,actor,updated_at}] — Get repository ruleset history
GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history/{version_id} -> {version_id,actor,updated_at,state} — Get repository ruleset version
GET /repos/{owner}/{repo}/stats/code_frequency -> [[integer]] — Get the weekly commit activity
GET /repos/{owner}/{repo}/stats/commit_activity -> [{days,total,week}] — Get the last year of commit activity
GET /repos/{owner}/{repo}/stats/contributors -> [{author,total,weeks}] — Get all contributor commit activity
GET /repos/{owner}/{repo}/stats/participation -> {all,owner} — Get the weekly commit count
GET /repos/{owner}/{repo}/stats/punch_card -> [[integer]] — Get the hourly commit count for each day
POST /repos/{owner}/{repo}/statuses/{sha} body:{state,target_url,description,context} -> {url,avatar_url,id,node_id,state,description,target_url,context,created_at,updated_at,creator} — Create a commit status
GET /repos/{owner}/{repo}/tags?per_page&page -> [{name,commit,zipball_url,tarball_url,node_id}] — List repository tags
GET /repos/{owner}/{repo}/tarball/{ref} -> ? — Download a repository archive (tar)
GET /repos/{owner}/{repo}/teams?per_page&page -> [{id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,members_url,+6more}] — List repository teams
GET /repos/{owner}/{repo}/topics?page&per_page -> {names} — Get all repository topics
PUT /repos/{owner}/{repo}/topics body:{names} -> {names} — Replace all repository topics
GET /repos/{owner}/{repo}/traffic/clones?per -> {count,uniques,clones} — Get repository clones
GET /repos/{owner}/{repo}/traffic/popular/paths -> [{path,title,count,uniques}] — Get top referral paths
GET /repos/{owner}/{repo}/traffic/popular/referrers -> [{referrer,count,uniques}] — Get top referral sources
GET /repos/{owner}/{repo}/traffic/views?per -> {count,uniques,views} — Get page views
POST /repos/{owner}/{repo}/transfer body:{new_owner,new_name,team_ids} -> {id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more} — Transfer a repository
GET /repos/{owner}/{repo}/vulnerability-alerts -> ? — Check if vulnerability alerts are enabled for a repository
PUT /repos/{owner}/{repo}/vulnerability-alerts -> ? — Enable vulnerability alerts
DELETE /repos/{owner}/{repo}/vulnerability-alerts -> ? — Disable vulnerability alerts
GET /repos/{owner}/{repo}/zipball/{ref} -> ? — Download a repository archive (zip)
POST /repos/{template_owner}/{template_repo}/generate body:{owner,name,description,include_all_branches,private} -> {id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+93more} — Create a repository using a template
GET /repositories?since -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List public repositories
GET /user/repos?visibility&affiliation&type&sort&direction&per_page&page&since&before -> [{id,node_id,name,full_name,license,forks,permissions,owner,private,html_url,description,fork,+86more}] — List repositories for the authenticated user
POST /user/repos body:{name,description,homepage,private,has_issues,has_projects,has_wiki,has_discussions,team_id,auto_init,gitignore_template,license_template,+11more} -> {id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+93more} — Create a repository for the authenticated user
GET /user/repository_invitations?per_page&page -> [{id,repository,invitee,inviter,permissions,created_at,expired,url,html_url,node_id}] — List repository invitations for the authenticated user
PATCH /user/repository_invitations/{invitation_id} -> ? — Accept a repository invitation
DELETE /user/repository_invitations/{invitation_id} -> ? — Decline a repository invitation
GET /users/{username}/repos?type&sort&direction&per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List repositories for a user

## search
GET /search/code?q*&sort&order&per_page&page -> {total_count,incomplete_results,items} — Search code
GET /search/commits?q*&sort&order&per_page&page -> {total_count,incomplete_results,items} — Search commits
GET /search/issues?q*&sort&order&per_page&page&advanced_search&search_type -> {total_count,incomplete_results,items,search_type,lexical_fallback_reason} — Search issues and pull requests
GET /search/labels?repository_id*&q*&sort&order&per_page&page -> {total_count,incomplete_results,items} — Search labels
GET /search/repositories?q*&sort&order&per_page&page -> {total_count,incomplete_results,items} — Search repositories
GET /search/topics?q*&per_page&page -> {total_count,incomplete_results,items} — Search topics
GET /search/users?q*&sort&order&per_page&page -> {total_count,incomplete_results,items} — Search users

## secret-scanning
GET /orgs/{org}/secret-scanning/alerts?state&secret_type&exclude_secret_types&exclude_providers&providers&resolution&assignee&sort&direction&page&per_page&before&after&validity&is_publicly_leaked&is_multi_repo&hide_secret&is_bypassed&included_metadata&owner_email_hash -> [{number,created_at,updated_at,url,html_url,locations_url,state,resolution,resolved_at,resolved_by,secret_type,secret_type_display_name,+22more}] — List secret scanning alerts for an organization
GET /orgs/{org}/secret-scanning/pattern-configurations -> {pattern_config_version,provider_pattern_overrides,custom_pattern_overrides} — List organization pattern configurations
PATCH /orgs/{org}/secret-scanning/pattern-configurations body:{pattern_config_version,provider_pattern_settings,custom_pattern_settings} -> {pattern_config_version} — Update organization pattern configurations
GET /repos/{owner}/{repo}/secret-scanning/alerts?state&secret_type&exclude_secret_types&exclude_providers&providers&resolution&assignee&sort&direction&page&per_page&before&after&validity&is_publicly_leaked&is_multi_repo&hide_secret&is_bypassed&included_metadata&owner_email_hash -> [{number,created_at,updated_at,url,html_url,locations_url,state,resolution,resolved_at,resolved_by,resolution_comment,secret_type,+21more}] — List secret scanning alerts for a repository
GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}?hide_secret -> {number,created_at,updated_at,url,html_url,locations_url,state,resolution,resolved_at,resolved_by,resolution_comment,secret_type,+22more} — Get a secret scanning alert
PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number} body:{state,resolution,resolution_comment,assignee,validity} -> {number,created_at,updated_at,url,html_url,locations_url,state,resolution,resolved_at,resolved_by,resolution_comment,secret_type,+22more} — Update a secret scanning alert
GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations?page&per_page -> [{type,details}] — List locations for a secret scanning alert
POST /repos/{owner}/{repo}/secret-scanning/push-protection-bypasses body:{reason,placeholder_id} -> {reason,expire_at,token_type} — Create a push protection bypass
GET /repos/{owner}/{repo}/secret-scanning/scan-history -> {incremental_scans,pattern_update_scans,backfill_scans,custom_pattern_backfill_scans,generic_secrets_backfill_scans} — Get secret scanning scan history for a repository

## security-advisories
GET /advisories?ghsa_id&type&cve_id&ecosystem&severity&cwes&is_withdrawn&affects&published&updated&modified&epss_percentage&epss_percentile&before&after&direction&per_page&sort -> [{ghsa_id,cve_id,url,html_url,repository_advisory_url,summary,description,type,severity,source_code_location,identifiers,references,+11more}] — List global security advisories
GET /advisories/{ghsa_id} -> {ghsa_id,cve_id,url,html_url,repository_advisory_url,summary,description,type,severity,source_code_location,identifiers,references,+11more} — Get a global security advisory
GET /orgs/{org}/security-advisories?direction&sort&before&after&per_page&state -> [{ghsa_id,cve_id,url,html_url,summary,description,severity,author,publisher,identifiers,state,created_at,+15more}] — List repository security advisories for an organization
GET /repos/{owner}/{repo}/security-advisories?direction&sort&before&after&per_page&state -> [{ghsa_id,cve_id,url,html_url,summary,description,severity,author,publisher,identifiers,state,created_at,+15more}] — List repository security advisories
POST /repos/{owner}/{repo}/security-advisories body:{summary,description,cve_id,vulnerabilities,cwe_ids,credits,severity,cvss_vector_string,start_private_fork} -> {ghsa_id,cve_id,url,html_url,summary,description,severity,author,publisher,identifiers,state,created_at,+15more} — Create a repository security advisory
POST /repos/{owner}/{repo}/security-advisories/reports body:{summary,description,vulnerabilities,cwe_ids,severity,cvss_vector_string,start_private_fork} -> {ghsa_id,cve_id,url,html_url,summary,description,severity,author,publisher,identifiers,state,created_at,+15more} — Privately report a security vulnerability
GET /repos/{owner}/{repo}/security-advisories/{ghsa_id} -> {ghsa_id,cve_id,url,html_url,summary,description,severity,author,publisher,identifiers,state,created_at,+15more} — Get a repository security advisory
PATCH /repos/{owner}/{repo}/security-advisories/{ghsa_id} body:{summary,description,cve_id,vulnerabilities,cwe_ids,credits,severity,cvss_vector_string,state,collaborating_users,collaborating_teams} -> {ghsa_id,cve_id,url,html_url,summary,description,severity,author,publisher,identifiers,state,created_at,+15more} — Update a repository security advisory
POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/cve -> object — Request a CVE for a repository security advisory
POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/forks -> {id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+93more} — Create a temporary private fork

## teams
GET /orgs/{org}/teams?per_page&page&team_type -> [{id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,members_url,+6more}] — List teams
POST /orgs/{org}/teams body:{name,description,maintainers,repo_names,privacy,notification_setting,permission,parent_team_id} -> {id,node_id,url,html_url,name,slug,description,privacy,notification_setting,permission,members_url,repositories_url,+10more} — Create a team
GET /orgs/{org}/teams/{team_slug} -> {id,node_id,url,html_url,name,slug,description,privacy,notification_setting,permission,members_url,repositories_url,+10more} — Get a team by name
PATCH /orgs/{org}/teams/{team_slug} body:{name,description,privacy,notification_setting,permission,parent_team_id} -> {id,node_id,url,html_url,name,slug,description,privacy,notification_setting,permission,members_url,repositories_url,+10more} — Update a team
DELETE /orgs/{org}/teams/{team_slug} -> ? — Delete a team
GET /orgs/{org}/teams/{team_slug}/invitations?per_page&page -> [{id,login,email,role,created_at,failed_at,failed_reason,inviter,team_count,node_id,invitation_teams_url,invitation_source}] — List pending team invitations
GET /orgs/{org}/teams/{team_slug}/members?role&per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+12more}] — List team members
GET /orgs/{org}/teams/{team_slug}/memberships/{username} -> {url,role,state} — Get team membership for a user
PUT /orgs/{org}/teams/{team_slug}/memberships/{username} body:{role} -> {url,role,state} — Add or update team membership for a user
DELETE /orgs/{org}/teams/{team_slug}/memberships/{username} -> ? — Remove team membership for a user
GET /orgs/{org}/teams/{team_slug}/repos?per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List team repositories
GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo} -> {id,node_id,name,full_name,license,forks,permissions,role_name,owner,private,html_url,description,+77more} — Check team permissions for a repository
PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo} body:{permission} -> ? — Add or update team repository permissions
DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo} -> ? — Remove a repository from a team
GET /orgs/{org}/teams/{team_slug}/teams?per_page&page -> [{id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,members_url,+6more}] — List child teams
GET /teams/{team_id} -> {id,node_id,url,html_url,name,slug,description,privacy,notification_setting,permission,members_url,repositories_url,+10more} — Get a team (Legacy)
PATCH /teams/{team_id} body:{name,description,privacy,notification_setting,permission,parent_team_id} -> {id,node_id,url,html_url,name,slug,description,privacy,notification_setting,permission,members_url,repositories_url,+10more} — Update a team (Legacy)
DELETE /teams/{team_id} -> ? — Delete a team (Legacy)
GET /teams/{team_id}/invitations?per_page&page -> [{id,login,email,role,created_at,failed_at,failed_reason,inviter,team_count,node_id,invitation_teams_url,invitation_source}] — List pending team invitations (Legacy)
GET /teams/{team_id}/members?role&per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+12more}] — List team members (Legacy)
GET /teams/{team_id}/members/{username} -> ? — Get team member (Legacy)
PUT /teams/{team_id}/members/{username} -> ? — Add team member (Legacy)
DELETE /teams/{team_id}/members/{username} -> ? — Remove team member (Legacy)
GET /teams/{team_id}/memberships/{username} -> {url,role,state} — Get team membership for a user (Legacy)
PUT /teams/{team_id}/memberships/{username} body:{role} -> {url,role,state} — Add or update team membership for a user (Legacy)
DELETE /teams/{team_id}/memberships/{username} -> ? — Remove team membership for a user (Legacy)
GET /teams/{team_id}/repos?per_page&page -> [{id,node_id,name,full_name,owner,private,html_url,description,fork,url,archive_url,assignees_url,+78more}] — List team repositories (Legacy)
GET /teams/{team_id}/repos/{owner}/{repo} -> {id,node_id,name,full_name,license,forks,permissions,role_name,owner,private,html_url,description,+77more} — Check team permissions for a repository (Legacy)
PUT /teams/{team_id}/repos/{owner}/{repo} body:{permission} -> ? — Add or update team repository permissions (Legacy)
DELETE /teams/{team_id}/repos/{owner}/{repo} -> ? — Remove a repository from a team (Legacy)
GET /teams/{team_id}/teams?per_page&page -> [{id,node_id,name,slug,description,privacy,notification_setting,permission,permissions,url,html_url,members_url,+6more}] — List child teams (Legacy)
GET /user/teams?per_page&page -> [{id,node_id,url,html_url,name,slug,description,privacy,notification_setting,permission,members_url,repositories_url,+10more}] — List teams for the authenticated user

## users
GET /user -> any — Get the authenticated user
PATCH /user body:{name,email,blog,twitter_username,company,location,hireable,bio} -> {login,id,user_view_type,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,starred_url,+31more} — Update the authenticated user
GET /user/blocks?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List users blocked by the authenticated user
GET /user/blocks/{username} -> ? — Check if a user is blocked by the authenticated user
PUT /user/blocks/{username} -> ? — Block a user
DELETE /user/blocks/{username} -> ? — Unblock a user
PATCH /user/email/visibility body:{visibility} -> [{email,primary,verified,visibility}] — Set primary email visibility for the authenticated user
GET /user/emails?per_page&page -> [{email,primary,verified,visibility}] — List email addresses for the authenticated user
POST /user/emails body:any -> [{email,primary,verified,visibility}] — Add an email address for the authenticated user
DELETE /user/emails body:any -> ? — Delete an email address for the authenticated user
GET /user/followers?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List followers of the authenticated user
GET /user/following?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List the people the authenticated user follows
GET /user/following/{username} -> ? — Check if a person is followed by the authenticated user
PUT /user/following/{username} -> ? — Follow a user
DELETE /user/following/{username} -> ? — Unfollow a user
GET /user/gpg_keys?per_page&page -> [{id,name,primary_key_id,key_id,public_key,emails,subkeys,can_sign,can_encrypt_comms,can_encrypt_storage,can_certify,created_at,+3more}] — List GPG keys for the authenticated user
POST /user/gpg_keys body:{name,armored_public_key} -> {id,name,primary_key_id,key_id,public_key,emails,subkeys,can_sign,can_encrypt_comms,can_encrypt_storage,can_certify,created_at,+3more} — Create a GPG key for the authenticated user
GET /user/gpg_keys/{gpg_key_id} -> {id,name,primary_key_id,key_id,public_key,emails,subkeys,can_sign,can_encrypt_comms,can_encrypt_storage,can_certify,created_at,+3more} — Get a GPG key for the authenticated user
DELETE /user/gpg_keys/{gpg_key_id} -> ? — Delete a GPG key for the authenticated user
GET /user/keys?per_page&page -> [{key,id,url,title,created_at,verified,read_only,last_used}] — List public SSH keys for the authenticated user
POST /user/keys body:{title,key} -> {key,id,url,title,created_at,verified,read_only,last_used} — Create a public SSH key for the authenticated user
GET /user/keys/{key_id} -> {key,id,url,title,created_at,verified,read_only,last_used} — Get a public SSH key for the authenticated user
DELETE /user/keys/{key_id} -> ? — Delete a public SSH key for the authenticated user
GET /user/public_emails?per_page&page -> [{email,primary,verified,visibility}] — List public email addresses for the authenticated user
GET /user/social_accounts?per_page&page -> [{provider,url}] — List social accounts for the authenticated user
POST /user/social_accounts body:{account_urls} -> [{provider,url}] — Add social accounts for the authenticated user
DELETE /user/social_accounts body:{account_urls} -> ? — Delete social accounts for the authenticated user
GET /user/ssh_signing_keys?per_page&page -> [{key,id,title,created_at}] — List SSH signing keys for the authenticated user
POST /user/ssh_signing_keys body:{title,key} -> {key,id,title,created_at} — Create a SSH signing key for the authenticated user
GET /user/ssh_signing_keys/{ssh_signing_key_id} -> {key,id,title,created_at} — Get an SSH signing key for the authenticated user
DELETE /user/ssh_signing_keys/{ssh_signing_key_id} -> ? — Delete an SSH signing key for the authenticated user
GET /user/{account_id} -> any — Get a user using their ID
GET /users?since&per_page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List users
GET /users/{username} -> any — Get a user
POST /users/{username}/attestations/bulk-list?per_page&before&after body:{subject_digests,predicate_type} -> {attestations_subject_digests,page_info} — List attestations by bulk subject digests
POST /users/{username}/attestations/delete-request body:object -> ok — Delete attestations in bulk
DELETE /users/{username}/attestations/digest/{subject_digest} -> ok — Delete attestations by subject digest
DELETE /users/{username}/attestations/{attestation_id} -> ok — Delete attestations by ID
GET /users/{username}/attestations/{subject_digest}?per_page&before&after&predicate_type -> {attestations} — List attestations
GET /users/{username}/followers?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List followers of a user
GET /users/{username}/following?per_page&page -> [{name,email,login,id,node_id,avatar_url,gravatar_id,url,html_url,followers_url,following_url,gists_url,+10more}] — List the people a user follows
GET /users/{username}/following/{target_user} -> ? — Check if a user follows another user
GET /users/{username}/gpg_keys?per_page&page -> [{id,name,primary_key_id,key_id,public_key,emails,subkeys,can_sign,can_encrypt_comms,can_encrypt_storage,can_certify,created_at,+3more}] — List GPG keys for a user
GET /users/{username}/hovercard?subject_type&subject_id -> {contexts} — Get contextual information for a user
GET /users/{username}/keys?per_page&page -> [{id,key,created_at,last_used}] — List public keys for a user
GET /users/{username}/social_accounts?per_page&page -> [{provider,url}] — List social accounts for a user
GET /users/{username}/ssh_signing_keys?per_page&page -> [{key,id,title,created_at}] — List SSH signing keys for a user
