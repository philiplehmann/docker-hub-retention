export interface DockerImage {
  architecture: string;
  features: string;
  variant: string | null;
  digest: string;
  os: string;
  os_features: string;
  os_version: string | null;
  size: number;
  created: string;
  status: string;
  last_pulled: string;
  last_pushed: string;
}

export interface DockerTag {
  creator: number;
  id: number;
  images: DockerImage[];
  last_updated: string;
  last_updater: number;
  last_updater_username: string;
  name: string;
  repository: number;
  full_size: number;
  v2: boolean;
  tag_status: string;
  tag_last_pulled: string;
  tag_last_pushed: string;
  media_type: string;
  content_type: string;
  digest: string;
}

export interface DockerTagList {
  count: number;
  next: string | null;
  previous: string | null;
  results: DockerTag[];
}

export class DockerRegistry {
  private repository: string;
  private authToken?: string;
  private tagListLimit = 100;

  constructor({
    repository,
  }: {
    repository: string;
  }) {
    this.repository = repository;
  }

  async login(username: string, password: string): Promise<void> {
    const response = await fetch('https://hub.docker.com/v2/users/login/', {
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const body = await response.json();
    this.authToken = body.token;
  }

  async getTags(): Promise<DockerTag[]> {
    const result = await this.getTagsPage();
    const pages = Math.ceil(result.count / this.tagListLimit);

    const tags = result.results;

    for (let i = 2; i <= pages; i++) {
      const page = await this.getTagsPage(i);
      tags.push(...page.results);
    }

    return tags;
  }

  async getTagsPage(page = 1): Promise<DockerTagList> {
    const [namespace, repository] = this.repository.split('/');
    const response = await fetch(
      `https://hub.docker.com/v2/namespaces/${namespace}/repositories/${repository}/tags?page_size=${this.tagListLimit}&page=${page}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.authToken}` },
      },
    );
    return await response.json();
  }

  async deleteTag(tag: string): Promise<void> {
    const response = await fetch(`https://hub.docker.com/v2/repositories/${this.repository}/tags/${tag}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        Accept: 'application/json',
      },
    });
    if (response.status !== 204) {
      throw new Error(`Failed to delete tag ${tag}`);
    }
  }
}
