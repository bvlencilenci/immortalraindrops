<xsl:stylesheet xmlns:xsl = "http://www.w3.org/1999/XSL/Transform" version = "1.0" >
<xsl:output method="text" media-type="application/json" indent="no" encoding="UTF-8" />
<xsl:template match = "/icestats" >
{
  "connections": <xsl:value-of select="connections" />,
  "listeners": <xsl:value-of select="listeners" />,
  "sources": [
    <xsl:for-each select="source">
      {
        "mount": "<xsl:value-of select="@mount" />",
        "listeners": <xsl:value-of select="listeners" />,
        "connected": <xsl:value-of select="connected" />,
        "title": "<xsl:value-of select="title" />",
        "artist": "<xsl:value-of select="artist" />",
        "description": "<xsl:value-of select="server_description" />"
      }<xsl:if test="position() != last()">,</xsl:if>
    </xsl:for-each>
  ]
}
</xsl:template>
</xsl:stylesheet>
